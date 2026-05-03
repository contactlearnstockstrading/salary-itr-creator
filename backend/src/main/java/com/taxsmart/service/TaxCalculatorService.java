package com.taxsmart.service;

import com.taxsmart.model.TaxRequest;
import com.taxsmart.model.TaxResponse;
import com.taxsmart.model.TaxResponse.Suggestion;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Core tax calculation engine for Indian salaried employees (Old Regime, FY 2024-25).
 *
 * CALCULATION FLOW:
 * ─────────────────
 * 1. Gross Salary (CTC / annual take-home)
 *    MINUS Standard Deduction (flat ₹50,000)
 *    MINUS HRA Exemption      (min of 3 conditions)
 *    MINUS LTA Exemption      (capped ₹75,000)
 *    MINUS Section 80C        (capped ₹1,50,000)
 *    MINUS Section 80CCD(1B)  (NPS personal, capped ₹50,000)
 *    MINUS Section 80CCD(2)   (NPS employer, capped 10% of basic)
 *    MINUS Section 80TTA      (savings interest, capped ₹10,000)
 *    ─────────────────────────────────────────────────────────────
 *    = TAXABLE INCOME
 *
 * 2. Tax on Taxable Income (Old Regime slabs):
 *    0 – 2,50,000        → 0%
 *    2,50,001 – 5,00,000 → 5%   (max ₹12,500)
 *    5,00,001 – 10,00,000→ 20%  (max ₹1,00,000)
 *    Above 10,00,000     → 30%
 *
 * 3. Surcharge (on base tax):
 *    Income 50L – 1 Cr   → 10%
 *    Income 1 Cr – 2 Cr  → 15%
 *    Income 2 Cr – 5 Cr  → 25%
 *    Income > 5 Cr       → 37%
 *
 * 4. Education + Health Cess: 4% on (tax + surcharge)
 *
 * 5. Section 87A Rebate: If taxable income ≤ ₹5,00,000 → final tax = ₹0
 *
 * HRA EXEMPTION (minimum of 3):
 * ─────────────────────────────
 *   Condition 1: Actual HRA received
 *   Condition 2: Rent paid − 10% of basic salary
 *   Condition 3: 50% of basic (metro) / 40% of basic (non-metro)
 */
@Service
public class TaxCalculatorService {

    // ── Deduction limits ──────────────────────────────────────────────────────
    private static final long STANDARD_DEDUCTION      = 50_000L;
    private static final long MAX_80C                 = 1_50_000L;
    private static final long MAX_80TTA               = 10_000L;
    private static final long MAX_80CCD1B             = 50_000L;
    private static final long LTA_CAP                 = 75_000L;
    private static final long NEW_STANDARD_DEDUCTION  = 75_000L;  // Budget 2024

    // ── Public entry point ────────────────────────────────────────────────────

    public TaxResponse calculate(TaxRequest req) {

        // --- Step 1: Compute each deduction ---
        long hraExemption    = computeHRA(req.getBasicSalary(), req.getHraReceived(), req.getRentPaid(), req.isMetro());
        long ltaExemption    = (long) Math.min(req.getLtaReceived(), LTA_CAP);
        long ded80C          = (long) Math.min(req.getSection80C(), MAX_80C);
        long ded80CCD1B      = (long) Math.min(req.getSection80CCD1B(), MAX_80CCD1B);
        long ded80CCD2       = (long) Math.min(req.getSection80CCD2(), 0.10 * req.getBasicSalary());
        long ded80TTA        = (long) Math.min(req.getSavingsInterest(), MAX_80TTA);

        // --- Step 2: Build breakdown map (insertion order preserved) ---
        Map<String, Long> breakdown = new LinkedHashMap<>();
        breakdown.put("standardDeduction", STANDARD_DEDUCTION);
        breakdown.put("80C",               ded80C);
        breakdown.put("80CCD1B",           ded80CCD1B);
        breakdown.put("80CCD2",            ded80CCD2);
        breakdown.put("80TTA",             ded80TTA);
        breakdown.put("HRA",               hraExemption);
        breakdown.put("LTA",               ltaExemption);

        // --- Step 3: Taxable income ---
        long totalDeductions = breakdown.values().stream().mapToLong(Long::longValue).sum();
        long taxableIncome   = Math.max(0L, (long) req.getGrossSalary() - totalDeductions);

        // --- Step 4: Tax ---
        long estimatedTax    = computeTax(taxableIncome);
        double effectiveRate = req.getGrossSalary() > 0
                ? Math.round((estimatedTax / req.getGrossSalary()) * 10_000.0) / 100.0
                : 0.0;

        // --- Step 5: Old Regime suggestions ---
        List<Suggestion> suggestions = buildSuggestions(req, breakdown, taxableIncome, estimatedTax);

        // --- Step 6: New Regime calculation ---
        long newDed80CCD2 = (long) Math.min(req.getSection80CCD2(), 0.10 * req.getBasicSalary());
        Map<String, Long> newBreakdown = new LinkedHashMap<>();
        newBreakdown.put("standardDeduction", NEW_STANDARD_DEDUCTION);
        newBreakdown.put("80CCD2",            newDed80CCD2);

        long newTotalDeductions = NEW_STANDARD_DEDUCTION + newDed80CCD2;
        long newTaxableIncome   = Math.max(0L, (long) req.getGrossSalary() - newTotalDeductions);
        long newEstimatedTax    = computeNewRegimeTax(newTaxableIncome);
        double newEffectiveRate = req.getGrossSalary() > 0
                ? Math.round((newEstimatedTax / req.getGrossSalary()) * 10_000.0) / 100.0 : 0.0;

        List<Suggestion> newSuggestions = buildNewRegimeSuggestions(req, newDed80CCD2, newTaxableIncome, newEstimatedTax);

        String recommendedRegime = newEstimatedTax < estimatedTax ? "NEW" : "OLD";

        // --- Step 7: Interest liability (234A / 234B / 234C / 244A) ---
        // Use the recommended regime's tax as the base for compliance calculations
        long taxForCompliance = recommendedRegime.equals("NEW") ? newEstimatedTax : estimatedTax;
        TaxResponse.InterestDetails interestDetails = computeInterestLiability(req, taxForCompliance);

        return TaxResponse.builder()
                .taxableIncome(taxableIncome)
                .totalDeductions(totalDeductions)
                .estimatedTax(estimatedTax)
                .effectiveTaxRate(effectiveRate)
                .grossSalary(req.getGrossSalary())
                .breakdown(breakdown)
                .suggestions(suggestions)
                .newRegimeTaxableIncome(newTaxableIncome)
                .newRegimeTotalDeductions(newTotalDeductions)
                .newRegimeEstimatedTax(newEstimatedTax)
                .newRegimeEffectiveTaxRate(newEffectiveRate)
                .newRegimeBreakdown(newBreakdown)
                .newRegimeSuggestions(newSuggestions)
                .recommendedRegime(recommendedRegime)
                .interestDetails(interestDetails)
                .build();
    }

    // ── Tax computation ───────────────────────────────────────────────────────

    /**
     * Computes total tax: slabs + surcharge + 4% cess − 87A rebate.
     * Package-private for unit testing.
     */
    long computeTax(long income) {
        if (income <= 0) return 0L;

        // Slab tax
        double baseTax = 0;
        if (income > 2_50_000)   baseTax += Math.min(income - 2_50_000, 2_50_000) * 0.05;
        if (income > 5_00_000)   baseTax += Math.min(income - 5_00_000, 5_00_000) * 0.20;
        if (income > 10_00_000)  baseTax += (income - 10_00_000) * 0.30;

        // Surcharge on base tax
        double surcharge = 0;
        if      (income > 5_00_00_000)  surcharge = baseTax * 0.37;
        else if (income > 2_00_00_000)  surcharge = baseTax * 0.25;
        else if (income > 1_00_00_000)  surcharge = baseTax * 0.15;
        else if (income >   50_00_000)  surcharge = baseTax * 0.10;

        // Education + Health Cess: 4%
        double total = (baseTax + surcharge) * 1.04;

        // Section 87A: full rebate if taxable income ≤ ₹5,00,000
        if (income <= 5_00_000) total = 0;

        return Math.round(total);
    }

    // ── HRA exemption (minimum of 3 conditions) ───────────────────────────────

    private long computeHRA(double basic, double hraReceived, double rentPaid, boolean metro) {
        if (hraReceived <= 0 || rentPaid <= 0) return 0L;
        double c1 = hraReceived;                                    // Condition 1
        double c2 = Math.max(0, rentPaid - 0.10 * basic);          // Condition 2
        double c3 = metro ? 0.50 * basic : 0.40 * basic;           // Condition 3
        return Math.round(Math.min(c1, Math.min(c2, c3)));
    }

    // ── Suggestion engine ─────────────────────────────────────────────────────

    private List<Suggestion> buildSuggestions(
            TaxRequest req,
            Map<String, Long> bd,
            long taxableIncome,
            long currentTax) {

        List<Suggestion> list = new ArrayList<>();

        suggest80C(req, bd, taxableIncome, currentTax, list);
        suggest80CCD1B(req, bd, taxableIncome, currentTax, list);
        suggestHRA(req, bd, taxableIncome, currentTax, list);
        suggest80CCD2(req, bd, taxableIncome, currentTax, list);
        suggest80TTA(req, list);
        suggestLTA(bd, list);
        suggestSurcharge(taxableIncome, list);

        // Sort: HIGH → MEDIUM → INFO
        list.sort(Comparator.comparingInt(s -> switch (s.getPriority()) {
            case "HIGH"   -> 0;
            case "MEDIUM" -> 1;
            default       -> 2;
        }));

        return list;
    }

    // ─── Individual suggestion builders ───────────────────────────────────────

    private void suggest80C(TaxRequest req, Map<String, Long> bd,
                            long taxable, long tax, List<Suggestion> out) {
        long used = bd.get("80C");
        if (used >= MAX_80C) return;

        long gap     = MAX_80C - used;
        long saving  = tax - computeTax(Math.max(0, taxable - gap));

        out.add(Suggestion.builder()
                .section("80C")
                .priority(gap > 50_000 ? "HIGH" : "MEDIUM")
                .title(inr(gap) + " of Section 80C Limit Still Unutilized")
                .message("You can invest " + inr(gap) + " more to claim the full " + inr(MAX_80C)
                        + " deduction under Section 80C and save up to " + inr(saving) + " in tax.")
                .details(List.of(
                        "ELSS Mutual Funds – 3-year lock-in, historically 12–15% p.a. returns (best for wealth creation + tax saving)",
                        "PPF (Public Provident Fund) – 7.1% tax-free returns, govt-backed, 15-year tenure with partial withdrawal",
                        "Life Insurance Premium (term plan / LIC / endowment policy) – protect family AND save tax",
                        "5-Year Tax-Saving Fixed Deposit – guaranteed returns, zero market risk",
                        "NSC (National Savings Certificate) – 7.7% p.a., issued by India Post, 5-year maturity",
                        "EPF Voluntary Provident Fund (VPF) top-up – earns same rate as EPF (8.15%), fully tax-free",
                        "Home loan principal repayment (if applicable) – qualifies under 80C",
                        "Children's tuition fees for up to 2 children – full-time education in India only"
                ))
                .potentialSaving(Math.max(0, saving))
                .build());
    }

    private void suggest80CCD1B(TaxRequest req, Map<String, Long> bd,
                                long taxable, long tax, List<Suggestion> out) {
        long used = bd.get("80CCD1B");
        if (used >= MAX_80CCD1B) return;

        long gap    = MAX_80CCD1B - used;
        long saving = tax - computeTax(Math.max(0, taxable - gap));

        out.add(Suggestion.builder()
                .section("80CCD(1B)")
                .priority("HIGH")
                .title("NPS Tier-1: Exclusive " + inr(gap) + " Extra Deduction Available")
                .message("Section 80CCD(1B) grants an ADDITIONAL " + inr(MAX_80CCD1B)
                        + " deduction OVER AND ABOVE your " + inr(MAX_80C)
                        + " 80C limit — exclusively for NPS Tier-1. Potential saving: " + inr(saving) + ".")
                .details(List.of(
                        "NPS Tier-1 is a government-regulated pension account – very safe and transparent",
                        "Choose your allocation: Equity (E) up to 75%, Corporate Bonds (C), Govt Securities (G)",
                        "This deduction is SEPARATE from 80C — combine both for maximum Rs.2,00,000 deduction",
                        "Open NPS online at enps.nsdl.com or through your bank (SBI, HDFC, ICICI, etc.)",
                        "At retirement: 60% lump sum (partially tax-free) + 40% mandatory annuity for monthly pension",
                        "Partial withdrawals allowed after 3 years for specified reasons (illness, education, home)",
                        "Available under Old Tax Regime only"
                ))
                .potentialSaving(Math.max(0, saving))
                .build());
    }

    private void suggestHRA(TaxRequest req, Map<String, Long> bd,
                            long taxable, long tax, List<Suggestion> out) {
        if (req.getHraReceived() <= 0) return;

        if (req.getRentPaid() <= 0) {
            // HRA received but no rent claimed
            double maxPossible = Math.min(req.getHraReceived(),
                    req.isMetro() ? 0.50 * req.getBasicSalary() : 0.40 * req.getBasicSalary());
            long saving = tax - computeTax(Math.max(0, taxable - (long) maxPossible));

            out.add(Suggestion.builder()
                    .section("HRA")
                    .priority("HIGH")
                    .title("HRA Received But Exemption Not Claimed — Potential Loss: " + inr(saving))
                    .message("You receive HRA of " + inr((long) req.getHraReceived())
                            + "/yr but declared zero rent. Paying rent (even to parents) could save up to "
                            + inr(saving) + " in tax annually.")
                    .details(List.of(
                            "Pay rent to parents or in-laws — 100% legal, accepted by Income Tax Dept.",
                            "Your parents declare it as rental income (usually in 0% or 5% slab due to basic exemption)",
                            "Get monthly rent receipts on ₹100 stamp paper signed by the landlord",
                            "Submit Form 12BB to HR/employer with: landlord name, address, and monthly amount",
                            "If annual rent exceeds ₹1,00,000 — mandatory to provide landlord's PAN card",
                            "HRA Exemption Formula: minimum of (1) Actual HRA, (2) Rent − 10% basic, (3) 50/40% basic"
                    ))
                    .potentialSaving(Math.max(0, saving))
                    .build());

        } else {
            // HRA claimed but might be limited
            long currentHRA = bd.get("HRA");
            if (currentHRA < (long) req.getHraReceived()) {
                double c1 = req.getHraReceived();
                double c2 = Math.max(0, req.getRentPaid() - 0.10 * req.getBasicSalary());
                double c3 = req.isMetro() ? 0.50 * req.getBasicSalary() : 0.40 * req.getBasicSalary();
                String limiting = (c2 <= c1 && c2 <= c3) ? "Condition 2 (Rent − 10% of basic)"
                        : "Condition 3 (" + (req.isMetro() ? "50" : "40") + "% of basic)";

                out.add(Suggestion.builder()
                        .section("HRA")
                        .priority("MEDIUM")
                        .title("HRA Exemption Capped by " + limiting)
                        .message("Your HRA exemption is " + inr(currentHRA) + " out of "
                                + inr((long) req.getHraReceived())
                                + " received. The lowest of 3 conditions applies.")
                        .details(List.of(
                                "Condition 1 – Actual HRA received: " + inr((long) req.getHraReceived()),
                                "Condition 2 – Rent paid − 10% of basic: " + inr((long) Math.max(0, req.getRentPaid() - 0.10 * req.getBasicSalary())),
                                "Condition 3 – " + (req.isMetro() ? "50" : "40") + "% of basic salary: "
                                        + inr((long) (req.isMetro() ? 0.50 * req.getBasicSalary() : 0.40 * req.getBasicSalary())),
                                "Increasing your rent paid can raise Condition 2 and potentially increase your exemption",
                                "Ensure you are paying actual rent — sub-letting your own property to yourself is not allowed"
                        ))
                        .potentialSaving(0L)
                        .build());
            }
        }
    }

    private void suggest80CCD2(TaxRequest req, Map<String, Long> bd,
                               long taxable, long tax, List<Suggestion> out) {
        long used = bd.get("80CCD2");
        if (used > 0) return;

        long maxPossible = Math.round(0.10 * req.getBasicSalary());
        long saving      = tax - computeTax(Math.max(0, taxable - maxPossible));

        out.add(Suggestion.builder()
                .section("80CCD(2)")
                .priority("MEDIUM")
                .title("Employer NPS [80CCD(2)] Not Used — Free Tax Saving via CTC Restructuring")
                .message("Employer NPS contribution is FULLY TAX-FREE with no monetary cap. For your basic salary, max benefit is "
                        + inr(maxPossible) + "/yr — saving up to " + inr(saving) + " at zero extra cost.")
                .details(List.of(
                        "Request HR to restructure your CTC: reduce a taxable component, add Employer NPS contribution",
                        "Your total CTC stays exactly the same — no cost to you or employer",
                        "Private sector employees: max 10% of (Basic + DA) under 80CCD(2)",
                        "This deduction works under BOTH Old and New Tax Regime — universally beneficial",
                        "It builds your NPS retirement corpus while saving tax every year",
                        "Unlike 80C and 80CCD(1B), this has no fixed upper limit in law (capped by 10% of basic)"
                ))
                .potentialSaving(Math.max(0, saving))
                .build());
    }

    private void suggest80TTA(TaxRequest req, List<Suggestion> out) {
        double interest = req.getSavingsInterest();
        if (interest <= 0) return;

        if (interest <= MAX_80TTA) {
            out.add(Suggestion.builder()
                    .section("80TTA")
                    .priority("INFO")
                    .title("Savings Interest " + inr((long) interest) + " Fully Exempt Under 80TTA")
                    .message("Your entire savings account interest is within the " + inr(MAX_80TTA)
                            + " Section 80TTA limit — no tax on this amount.")
                    .details(List.of(
                            "80TTA covers interest from: savings accounts in scheduled banks, co-op banks, and post offices",
                            "Fixed Deposit / Recurring Deposit interest is NOT covered — it is fully taxable",
                            "Senior citizens (age 60+) should use Section 80TTB instead — limit is Rs.50,000",
                            "Remember to declare this interest in your ITR under 'Income from Other Sources'",
                            "Collect interest certificate from your bank for accurate reporting"
                    ))
                    .potentialSaving(0L)
                    .build());
        } else {
            long excess = (long) interest - MAX_80TTA;
            out.add(Suggestion.builder()
                    .section("80TTA")
                    .priority("INFO")
                    .title("80TTA Limit Exceeded — " + inr(excess) + " Extra Interest is Taxable")
                    .message("Only " + inr(MAX_80TTA) + " of your " + inr((long) interest)
                            + " savings interest is exempt. The remaining " + inr(excess) + " is added to taxable income.")
                    .details(List.of(
                            "Spreading savings across multiple banks does NOT increase the 80TTA exemption limit",
                            "Consider parking excess funds in liquid debt mutual funds — more tax-efficient (LTCG if held 3+ yrs)",
                            "ELSS or PPF could be better alternatives for parking surplus cash with tax benefits",
                            "Declare all interest income in ITR (Form 26AS reconciliation) to avoid IT notices"
                    ))
                    .potentialSaving(0L)
                    .build());
        }
    }

    private void suggestLTA(Map<String, Long> bd, List<Suggestion> out) {
        long lta = bd.get("LTA");
        if (lta <= 0) return;

        out.add(Suggestion.builder()
                .section("LTA")
                .priority("INFO")
                .title("LTA Exemption of " + inr(lta) + " Applied — Keep Your Travel Documents")
                .message("Leave Travel Allowance exemption has been applied. Ensure you submit travel proof to your employer.")
                .details(List.of(
                        "LTA covers DOMESTIC travel only — international travel is not exempt",
                        "Available TWICE in a 4-year block (current block: 2022–2025)",
                        "Eligible transport: Economy class airfare OR AC First Class / AC 2-Tier rail fare",
                        "Submit to employer: boarding passes, air/rail tickets, hotel bills (travel only)",
                        "Covers travel of: self, spouse, up to 2 children, dependent parents and siblings",
                        "Unused LTA in a block can be carried forward to the first year of the next block (once)"
                ))
                .potentialSaving(0L)
                .build());
    }

    private void suggestSurcharge(long taxableIncome, List<Suggestion> out) {
        if (taxableIncome <= 50_00_000) return;

        int rate = taxableIncome > 5_00_00_000 ? 37
                : taxableIncome > 2_00_00_000 ? 25
                : taxableIncome > 1_00_00_000 ? 15 : 10;

        out.add(Suggestion.builder()
                .section("Surcharge")
                .priority("HIGH")
                .title("Surcharge Alert: " + rate + "% Surcharge on Tax — Advanced Planning Needed")
                .message("Your taxable income exceeds Rs.50 Lakh, attracting a " + rate
                        + "% surcharge on top of regular tax. Consult a CA for income restructuring.")
                .details(List.of(
                        "Form a Hindu Undivided Family (HUF) to split income — HUF gets its own basic exemption slab",
                        "Section 54 / 54F exemption if you have capital gains from property or equity sale",
                        "Gift to spouse or family members (clubbing provisions apply — verify with CA first)",
                        "All deductions (80C, NPS, HRA) are even more valuable — ₹1 saved = ₹1 + 37% surcharge + cess",
                        "Consider pre-paying home loan for 80C benefit and interest deduction under Section 24(b)",
                        "Explore LTCG (Long Term Capital Gains) harvesting on equity to utilize 10% LTCG exemption"
                ))
                .potentialSaving(0L)
                .build());
    }

    // ── New Tax Regime ────────────────────────────────────────────────────────

    /**
     * New Regime slabs (FY 2024-25, Budget 2024):
     *   0 – 3,00,000         → 0%
     *   3,00,001 – 7,00,000  → 5%
     *   7,00,001 – 10,00,000 → 10%
     *   10,00,001 – 12,00,000→ 15%
     *   12,00,001 – 15,00,000→ 20%
     *   Above 15,00,000      → 30%
     *
     * Surcharge rates same as Old Regime.
     * Section 87A: full rebate if taxable income ≤ ₹7,00,000.
     */
    long computeNewRegimeTax(long income) {
        if (income <= 0) return 0L;

        double baseTax = 0;
        if (income > 3_00_000)   baseTax += Math.min(income - 3_00_000, 4_00_000) * 0.05;
        if (income > 7_00_000)   baseTax += Math.min(income - 7_00_000, 3_00_000) * 0.10;
        if (income > 10_00_000)  baseTax += Math.min(income - 10_00_000, 2_00_000) * 0.15;
        if (income > 12_00_000)  baseTax += Math.min(income - 12_00_000, 3_00_000) * 0.20;
        if (income > 15_00_000)  baseTax += (income - 15_00_000) * 0.30;

        double surcharge = 0;
        if      (income > 5_00_00_000)  surcharge = baseTax * 0.37;
        else if (income > 2_00_00_000)  surcharge = baseTax * 0.25;
        else if (income > 1_00_00_000)  surcharge = baseTax * 0.15;
        else if (income >   50_00_000)  surcharge = baseTax * 0.10;

        double total = (baseTax + surcharge) * 1.04;

        // 87A rebate: taxable income ≤ ₹7,00,000 → zero tax in new regime
        if (income <= 7_00_000) total = 0;

        return Math.round(total);
    }

    private List<Suggestion> buildNewRegimeSuggestions(TaxRequest req, long ded80CCD2,
                                                        long taxableIncome, long estimatedTax) {
        List<Suggestion> list = new ArrayList<>();

        // 80CCD(2) is one of the very few deductions available in new regime
        if (ded80CCD2 == 0) {
            long maxPossible = Math.round(0.10 * req.getBasicSalary());
            long saving = estimatedTax - computeNewRegimeTax(Math.max(0, taxableIncome - maxPossible));

            list.add(Suggestion.builder()
                    .section("80CCD(2)")
                    .priority("HIGH")
                    .title("Employer NPS [80CCD(2)] Works in New Regime — " + inr(maxPossible) + " Tax-Free")
                    .message("80CCD(2) Employer NPS is one of the few deductions allowed under the New Regime. Your employer can contribute "
                            + inr(maxPossible) + "/yr tax-free, saving you up to " + inr(saving) + ".")
                    .details(List.of(
                            "80CCD(2) Employer NPS is explicitly allowed under the New Tax Regime — unlike 80C, HRA, LTA",
                            "Request HR to restructure your CTC: reduce a taxable component, add Employer NPS contribution",
                            "Total CTC stays exactly the same — zero extra cost to you or your employer",
                            "Private sector: up to 10% of Basic + DA qualifies; no fixed rupee cap in law",
                            "Builds your NPS retirement corpus tax-efficiently every year"
                    ))
                    .potentialSaving(Math.max(0, saving))
                    .build());
        }

        // Surcharge — same thresholds apply in new regime
        if (taxableIncome > 50_00_000) {
            int rate = taxableIncome > 5_00_00_000 ? 37
                    : taxableIncome > 2_00_00_000 ? 25
                    : taxableIncome > 1_00_00_000 ? 15 : 10;

            list.add(Suggestion.builder()
                    .section("Surcharge")
                    .priority("HIGH")
                    .title("Surcharge Alert: " + rate + "% Applies in New Regime Too — CA Planning Needed")
                    .message("Your New Regime taxable income exceeds ₹50L, attracting " + rate
                            + "% surcharge. Very few tools are available to reduce it under New Regime.")
                    .details(List.of(
                            "Employer NPS [80CCD(2)] is one of the few deductions that reduce New Regime taxable income",
                            "HUF (Hindu Undivided Family) formation splits income — valid under both regimes",
                            "New Regime caps surcharge at 25% for LTCG on equity — consult CA if you have investment income",
                            "Consult a CA for a personalised income-restructuring strategy"
                    ))
                    .potentialSaving(0L)
                    .build());
        }

        return list;
    }

    // ── Interest liability (234A / 234B / 234C / 244A) ───────────────────────

    /**
     * Computes interest and compliance status based on actual payments vs liability.
     *
     * ASSUMPTIONS (to keep inputs minimal):
     *  - TDS is deducted uniformly across 12 months.
     *  - Any extra advance tax paid by the user is treated as paid on 15th March
     *    (worst case for 234C installment timing).
     *  - 234B interest runs from 1st April to the filing date.
     *    Filing date = July 31 + monthsFilingDelay months.
     */
    TaxResponse.InterestDetails computeInterestLiability(TaxRequest req, long totalTax) {
        long tds         = (long) req.getTdsDeducted();
        long advanceTax  = (long) req.getAdvanceTaxPaid();
        int  delay       = req.getMonthsFilingDelay();

        long totalPaid  = tds + advanceTax;
        long netUnpaid  = Math.max(0L, totalTax - totalPaid);
        long refund     = Math.max(0L, totalPaid - totalTax);

        // ── 234A: Late filing interest ────────────────────────────────────────
        // 1% per month on unpaid tax, for each month (or part month) after July 31.
        long interest234A = 0;
        if (delay > 0 && netUnpaid > 0) {
            interest234A = Math.round(netUnpaid * 0.01 * delay);
        }

        // ── 234B: Insufficient advance tax ────────────────────────────────────
        // Applies when (TDS + advance tax paid) < 90% of total tax liability by March 31.
        // Interest runs from 1st April to the date of payment (i.e. filing date).
        long   threshold90  = Math.round(totalTax * 0.90);
        boolean applicable234B = totalPaid < threshold90;
        long   interest234B = 0;
        if (applicable234B && totalTax > 0) {
            long shortfall234B = totalTax - totalPaid;
            // April to July = 4 months base; add filing delay on top
            int months234B = 4 + delay;
            interest234B = Math.round(shortfall234B * 0.01 * months234B);
        }

        // ── 234C: Installment shortfalls ──────────────────────────────────────
        // TDS assumed uniform. Advance tax assumed paid on 15th March.
        // Installments:
        //   15-Jun : cumulative 15% required
        //   15-Sep : cumulative 45% required
        //   15-Dec : cumulative 75% required
        //   15-Mar : cumulative 100% required
        double monthlyTDS = tds / 12.0;

        record Installment(String date, int requiredPct, double tdsMonths, boolean includeAdvance) {}
        List<Installment> schedule = List.of(
                new Installment("15 Jun", 15,  2.5,  false),
                new Installment("15 Sep", 45,  5.5,  false),
                new Installment("15 Dec", 75,  8.5,  false),
                new Installment("15 Mar", 100, 11.5, true)
        );

        long interest234C = 0;
        boolean applicable234C = false;
        List<TaxResponse.InstallmentDetail> breakdown234C = new ArrayList<>();

        for (Installment inst : schedule) {
            long paidByDate = Math.round(monthlyTDS * inst.tdsMonths())
                    + (inst.includeAdvance() ? advanceTax : 0L);
            long required   = Math.round(totalTax * (inst.requiredPct() / 100.0));
            long shortfall  = Math.max(0L, required - paidByDate);
            // Last installment: 1 month interest; others: 3 months
            int months = inst.requiredPct() == 100 ? 1 : 3;
            long instInterest = Math.round(shortfall * 0.01 * months);
            interest234C += instInterest;
            if (instInterest > 0) applicable234C = true;

            breakdown234C.add(TaxResponse.InstallmentDetail.builder()
                    .date(inst.date())
                    .requiredPercent(inst.requiredPct())
                    .requiredAmount(required)
                    .paidByDate(paidByDate)
                    .shortfall(shortfall)
                    .interest(instInterest)
                    .build());
        }

        // ── 244A: Refund interest (government pays YOU) ───────────────────────
        // 0.5% per month on the refund amount.
        // If filed on time: refund interest starts April 1 → typically 3 months to process.
        // If filed late: interest starts from the filing date.
        long refundInterest244A = 0;
        if (refund > 0) {
            int refundMonths = delay == 0 ? 3 : Math.max(1, 3 - delay);
            refundInterest244A = Math.round(refund * 0.005 * refundMonths);
        }

        // ── Totals & status ───────────────────────────────────────────────────
        long totalBurden = interest234A + interest234B + interest234C;
        String status = totalBurden == 0 ? "SAFE"
                : totalBurden < 5_000   ? "WARNING"
                : "CRITICAL";

        // ── Action items ──────────────────────────────────────────────────────
        List<String> actions = new ArrayList<>();
        if (totalTax == 0) {
            actions.add("No tax liability this year — no interest sections apply to you.");
        } else {
            if (applicable234B || applicable234C) {
                actions.add("Inform your employer about all income sources (FD interest, freelance, capital gains) so they deduct correct TDS and cover all installments.");
                long remaining = totalTax - totalPaid;
                if (remaining > 0) {
                    actions.add("Pay " + inr(remaining) + " as advance tax immediately to stop 234B/234C interest accumulating further.");
                }
            }
            if (delay > 0 && netUnpaid > 0) {
                actions.add("File your ITR as soon as possible — each additional month adds " + inr(Math.round(netUnpaid * 0.01)) + " in 234A interest.");
            } else if (delay == 0) {
                actions.add("File on time by 31st July to avoid 234A interest on any unpaid balance.");
            }
            if (refund > 0) {
                actions.add("File early (April–June) — refund interest under 244A starts from 1st April when you file on time.");
                actions.add("Pre-validate your bank account on incometax.gov.in for instant refund credit.");
            }
            if (totalBurden == 0 && refund == 0 && netUnpaid == 0) {
                actions.add("Your TDS fully covers your tax liability — no interest sections applicable.");
                actions.add("File on time to avoid 234A and close out the year cleanly.");
            }
        }

        return TaxResponse.InterestDetails.builder()
                .tdsDeducted(tds)
                .advanceTaxPaid(advanceTax)
                .totalTaxPaid(totalPaid)
                .netTaxPayable(netUnpaid)
                .refundAmount(refund)
                .interest234A(interest234A)
                .monthsFilingDelay(delay)
                .interest234B(interest234B)
                .applicable234B(applicable234B)
                .threshold90Percent(threshold90)
                .interest234C(interest234C)
                .applicable234C(applicable234C)
                .refundInterest244A(refundInterest244A)
                .totalInterestBurden(totalBurden)
                .complianceStatus(status)
                .actionItems(actions)
                .installmentBreakdown(breakdown234C)
                .build();
    }

    // ── Formatting helper ─────────────────────────────────────────────────────

    /**
     * Formats a rupee amount in Indian-readable form.
     * Examples: 150000 → "Rs.1.5 L"  |  50000 → "Rs.50,000"  |  1200000 → "Rs.12 L"
     */
    private String inr(long amount) {
        if (amount >= 1_00_00_000) return String.format("Rs.%.1f Cr", amount / 1_00_00_000.0);
        if (amount >= 10_00_000)   return String.format("Rs.%.0f L",  amount / 1_00_000.0);
        if (amount >= 1_00_000)    return String.format("Rs.%.1f L",  amount / 1_00_000.0);
        if (amount >= 1_000)       return String.format("Rs.%,d",     amount);
        return "Rs." + amount;
    }
}
