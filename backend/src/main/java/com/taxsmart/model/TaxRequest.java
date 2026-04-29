package com.taxsmart.model;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Input DTO for tax calculation.
 * All monetary values are annual amounts in Indian Rupees.
 */
@Data
@NoArgsConstructor
public class TaxRequest {

    /** Total annual CTC / gross income (including all components) */
    private double grossSalary;

    /** Annual basic salary – used for HRA, NPS 80CCD(2) calculations */
    private double basicSalary;

    /** Annual HRA received as per salary slip */
    private double hraReceived;

    /** Annual rent actually paid by the employee */
    private double rentPaid;

    /**
     * true = Metro city (Delhi, Mumbai, Kolkata, Chennai) → 50% of basic for HRA
     * false = Non-metro → 40% of basic for HRA
     */
    private boolean metro = true;

    /** Annual Leave Travel Allowance received */
    private double ltaReceived;

    /**
     * Total Section 80C investments:
     * EPF employee share + PPF + ELSS + LIC premium + NSC + 5yr FD + home loan principal
     * (Capped at ₹1,50,000)
     */
    private double section80C;

    /**
     * Personal NPS Tier-1 contribution [Section 80CCD(1B)]
     * Additional deduction OVER AND ABOVE 80C (capped at ₹50,000)
     */
    private double section80CCD1B;

    /**
     * Employer's NPS contribution [Section 80CCD(2)]
     * Tax-free, capped at 10% of basic salary
     */
    private double section80CCD2;

    /** Total savings account interest from all banks (80TTA: exempt up to ₹10,000) */
    private double savingsInterest;
}
