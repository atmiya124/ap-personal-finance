"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

// Helper to format currency (default CAD)
const formatMoney = (amount: number) => formatCurrency(amount, "CAD");
import { TrendingUp, TrendingDown, DollarSign, Percent, Calculator } from "lucide-react";
import type { TaxCalculationResult } from "@/lib/tax-calculator";

interface TaxSummaryProps {
  record: any;
  calculation: TaxCalculationResult;
  comparison: {
    old: TaxCalculationResult;
    new: TaxCalculationResult;
    delta: number;
    betterRegime: "old" | "new";
  };
}

export function TaxSummary({ record, calculation, comparison }: TaxSummaryProps) {
  const taxableIncome = Math.max(0, record.totalIncome - record.totalDeductions);
  const isNewRegime = record.regime === "new";
  const currentTax = isNewRegime ? comparison.new.totalTax : comparison.old.totalTax;
  const otherRegimeTax = isNewRegime ? comparison.old.totalTax : comparison.new.totalTax;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(record.totalIncome)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Taxable: {formatMoney(taxableIncome)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(record.totalDeductions)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {record.totalDeductions > 0 
                ? `${((record.totalDeductions / record.totalIncome) * 100).toFixed(1)}% of income`
                : "No deductions"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Payable</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(calculation.totalTax)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Base: {formatMoney(calculation.baseTax)} + Cess: {formatMoney(calculation.cess)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Effective Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculation.effectiveRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {record.totalIncome > 0 
                ? `On ${formatCurrency(record.totalIncome)} income`
                : "No income"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Regime Comparison ({record.regime === "new" ? "New" : "Old"} vs {record.regime === "new" ? "Old" : "New"})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current Regime ({record.regime === "new" ? "New" : "Old"})</p>
              <p className="text-2xl font-bold">{formatMoney(currentTax)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Other Regime ({record.regime === "new" ? "Old" : "New"})</p>
              <p className="text-2xl font-bold">{formatMoney(otherRegimeTax)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Difference</p>
              <div className="flex items-center gap-2">
                {comparison.delta > 0 ? (
                  <TrendingDown className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-red-600" />
                )}
                <p className={`text-2xl font-bold ${comparison.delta > 0 ? "text-green-600" : "text-red-600"}`}>
                  {comparison.delta > 0 ? "-" : "+"}{formatMoney(comparison.delta)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {comparison.betterRegime === record.regime 
                  ? "You're on the better regime"
                  : `Switch to ${comparison.betterRegime === "new" ? "New" : "Old"} regime to save ${formatMoney(comparison.delta)}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

