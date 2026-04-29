package com.taxsmart.controller;

import com.taxsmart.model.TaxRequest;
import com.taxsmart.model.TaxResponse;
import com.taxsmart.service.TaxCalculatorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tax")
@CrossOrigin(origins = "*")
public class TaxController {

    private final TaxCalculatorService taxCalculatorService;

    public TaxController(TaxCalculatorService taxCalculatorService) {
        this.taxCalculatorService = taxCalculatorService;
    }

    /**
     * Calculate Old Regime tax and return optimization suggestions.
     *
     * POST /api/tax/calculate
     * Body: TaxRequest JSON
     * Response: TaxResponse JSON
     */
    @PostMapping("/calculate")
    public ResponseEntity<TaxResponse> calculate(@RequestBody TaxRequest request) {
        if (request.getGrossSalary() <= 0 || request.getBasicSalary() <= 0) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(taxCalculatorService.calculate(request));
    }
}
