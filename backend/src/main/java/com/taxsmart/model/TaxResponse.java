package com.taxsmart.model;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

/**
 * Output DTO – tax calculation result with CA-grade suggestions.
 */
@Getter
@Builder
public class TaxResponse {

    /** Income after all deductions (what tax is computed on) */
    private long taxableIncome;

    /** Sum of all deductions applied */
    private long totalDeductions;

    /** Final tax payable (after cess, surcharge, 87A rebate) */
    private long estimatedTax;

    /** Effective tax rate as % of gross salary */
    private double effectiveTaxRate;

    /** Original gross salary (for reference in UI) */
    private double grossSalary;

    /**
     * Deduction breakdown keyed by section:
     * standardDeduction, 80C, 80CCD1B, 80CCD2, 80TTA, HRA, LTA
     */
    private Map<String, Long> breakdown;

    /** CA-style suggestions sorted by priority (HIGH → MEDIUM → INFO) */
    private List<Suggestion> suggestions;

    // ── New Tax Regime (FY 2024-25, Budget 2024 slabs) ───────────────────────

    /** New Regime: income after standard deduction (₹75K) + employer NPS only */
    private long newRegimeTaxableIncome;

    /** New Regime: sum of deductions applied (standard ₹75K + 80CCD2) */
    private long newRegimeTotalDeductions;

    /** New Regime: final tax payable (after cess, surcharge, 87A rebate ≤ ₹7L) */
    private long newRegimeEstimatedTax;

    /** New Regime: effective tax rate as % of gross salary */
    private double newRegimeEffectiveTaxRate;

    /** New Regime: breakdown — standardDeduction + 80CCD2 only */
    private Map<String, Long> newRegimeBreakdown;

    /** New Regime: suggestions (80CCD2 if unused, surcharge if applicable) */
    private List<Suggestion> newRegimeSuggestions;

    /** "OLD" or "NEW" — whichever regime results in lower tax */
    private String recommendedRegime;

    @Getter
    @Builder
    public static class Suggestion {
        /** Tax section this suggestion applies to (e.g. "80C", "HRA") */
        private String section;

        /** HIGH = urgent saving possible | MEDIUM = worth acting on | INFO = informational */
        private String priority;

        /** Short headline shown on the card */
        private String title;

        /** One-line explanation */
        private String message;

        /** Bullet-point action steps shown in expandable section */
        private List<String> details;

        /** Estimated annual tax saving if this suggestion is acted upon (0 if informational) */
        private long potentialSaving;
    }
}
