"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Info, RefreshCw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TaxInputsProps {
  record: any;
  onInputChange: (updates: any) => void;
  dataFromTransactions?: {
    totalIncome: number;
    salaryIncome: number;
    otherIncome: number;
    capitalGains: number;
    taxSavingInvestments: number;
    healthInsurance: number;
    transactions: any[];
    incomeTransactions: any[];
    expenseTransactions: any[];
  };
}

export function TaxInputs({ record, onInputChange, dataFromTransactions }: TaxInputsProps) {
  // Initialize with record values, or use transaction data if record is empty
  const initialSalary = record.salary || dataFromTransactions?.salaryIncome || 0;
  const initialOtherIncome = record.otherIncome || dataFromTransactions?.otherIncome || 0;
  const initialCapitalGains = record.capitalGains || dataFromTransactions?.capitalGains || 0;
  const initialTaxSavingInvestments = record.taxSavingInvestments || dataFromTransactions?.taxSavingInvestments || 0;
  const initialHealthInsurance = record.healthInsurance || dataFromTransactions?.healthInsurance || 0;
  
  const [salary, setSalary] = useState(initialSalary);
  const [otherIncome, setOtherIncome] = useState(initialOtherIncome);
  const [capitalGains, setCapitalGains] = useState(initialCapitalGains);
  const [taxSavingInvestments, setTaxSavingInvestments] = useState(initialTaxSavingInvestments);
  const [healthInsurance, setHealthInsurance] = useState(initialHealthInsurance);
  const [regime, setRegime] = useState<"old" | "new">(record.regime || "new");

  // Auto-calculate standard deduction ($50,000 for salary)
  const standardDeduction = salary > 0 ? 50000 : 0;

  // Calculate totals
  const totalIncome = salary + otherIncome + capitalGains;
  const totalDeductions = standardDeduction + taxSavingInvestments + healthInsurance;

  // Update parent when values change
  useEffect(() => {
    const updates = {
      salary,
      otherIncome,
      capitalGains,
      standardDeduction,
      taxSavingInvestments,
      healthInsurance,
      totalIncome,
      totalDeductions,
      regime,
    };
    onInputChange(updates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salary, otherIncome, capitalGains, taxSavingInvestments, healthInsurance, regime]);

  const handleRegimeChange = (value: string) => {
    setRegime(value as "old" | "new");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Income Details</CardTitle>
            {dataFromTransactions && dataFromTransactions.totalIncome > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSalary(dataFromTransactions.salaryIncome);
                  setOtherIncome(dataFromTransactions.otherIncome);
                  setCapitalGains(dataFromTransactions.capitalGains);
                }}
                className="text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Load from Transactions
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {dataFromTransactions && dataFromTransactions.totalIncome > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
              <p className="text-blue-800 font-medium mb-1">
                💡 Data detected from transactions: ${dataFromTransactions.totalIncome.toLocaleString()}
              </p>
              <p className="text-blue-700 text-xs">
                Salary: ${dataFromTransactions.salaryIncome.toLocaleString()} | 
                Other: ${dataFromTransactions.otherIncome.toLocaleString()}
              </p>
              <p className="text-blue-600 text-xs mt-1">
                Click &quot;Load from Transactions&quot; to auto-fill all values
              </p>
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="salary">Salary</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Annual salary income (auto-filled from transactions if available)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="salary"
              type="number"
              value={salary}
              onChange={(e) => setSalary(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="otherIncome">Other Income</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Income from other sources (rent, interest, etc.)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="otherIncome"
              type="number"
              value={otherIncome}
              onChange={(e) => setOtherIncome(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="capitalGains">Capital Gains (Optional)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Short-term and long-term capital gains</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="capitalGains"
              type="number"
              value={capitalGains}
              onChange={(e) => setCapitalGains(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Income:</span>
              <span className="font-semibold">${totalIncome.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Deductions</CardTitle>
            {dataFromTransactions && (dataFromTransactions.taxSavingInvestments > 0 || dataFromTransactions.healthInsurance > 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTaxSavingInvestments(dataFromTransactions.taxSavingInvestments);
                  setHealthInsurance(dataFromTransactions.healthInsurance);
                }}
                className="text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Load from Transactions
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Standard Deduction</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Auto-applied $50,000 for salary income</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              type="number"
              value={standardDeduction}
              disabled
              className="bg-gray-50"
            />
          </div>
          
          {dataFromTransactions && dataFromTransactions.taxSavingInvestments > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-md p-2 text-xs">
              <p className="text-green-800">
                💡 Tax-saving investments detected: ${dataFromTransactions.taxSavingInvestments.toLocaleString()}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="taxSavingInvestments">Tax-saving Investments</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Section 80C investments (ELSS, PPF, etc.) - Max ₹1.5L</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
              <Input
                id="taxSavingInvestments"
                type="number"
                value={taxSavingInvestments}
                onChange={(e) => setTaxSavingInvestments(parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="healthInsurance">Health Insurance (Optional)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Section 80D premium - Max ₹25,000 (individual) / ₹50,000 (family)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="healthInsurance"
              type="number"
              value={healthInsurance}
              onChange={(e) => setHealthInsurance(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Deductions:</span>
              <span className="font-semibold">₹{totalDeductions.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax Regime</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={regime} onValueChange={handleRegimeChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new" className="cursor-pointer">
                New Regime (Default)
              </Label>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <RadioGroupItem value="old" id="old" />
              <Label htmlFor="old" className="cursor-pointer">
                Old Regime (with deductions)
              </Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground mt-4">
            {regime === "new"
              ? "New regime offers lower tax rates but limited deductions. Best for those with minimal investments."
              : "Old regime allows more deductions but higher tax rates. Best if you have significant tax-saving investments."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

