"use client";

import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaxSummary } from "@/components/TaxSummary";
import { TaxCharts } from "@/components/TaxCharts";
import { TaxInputs } from "@/components/TaxInputs";
import { calculateTax, compareRegimes, type Regime } from "@/lib/tax-calculator";
import { createTaxRecord, updateTaxRecord } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

interface TaxRecord {
  id?: string;
  financialYear: string;
  totalIncome: number;
  totalDeductions: number;
  regime: Regime;
  calculatedTax: number;
  effectiveRate: number;
  previousYearTax?: number | null;
  salary: number;
  otherIncome: number;
  capitalGains: number;
  standardDeduction: number;
  taxSavingInvestments: number;
  healthInsurance: number;
}

interface TaxClientProps {
  initialRecords: any[];
  currentFinancialYear: string;
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

export function TaxClient({ initialRecords, currentFinancialYear, dataFromTransactions }: TaxClientProps) {
  const [records, setRecords] = useState<TaxRecord[]>(initialRecords);
  const [activeTab, setActiveTab] = useState("summary");
  const { toast } = useToast();

  // Find or create current year record
  const currentRecord = useMemo(() => {
    const existing = records.find((r) => r.financialYear === currentFinancialYear);
    
    // If record exists, use it
    if (existing) {
      return existing;
    }

    // Create default record with transaction data if available
    const standardDeduction = (dataFromTransactions?.salaryIncome ?? 0) > 0 ? 50000 : 0;
    const totalDeductions = standardDeduction + (dataFromTransactions?.taxSavingInvestments || 0) + (dataFromTransactions?.healthInsurance || 0);
    
    const defaultRecord: TaxRecord = {
      financialYear: currentFinancialYear,
      totalIncome: dataFromTransactions?.totalIncome || 0,
      totalDeductions,
      regime: "new" as Regime,
      calculatedTax: 0,
      effectiveRate: 0,
      salary: dataFromTransactions?.salaryIncome || 0,
      otherIncome: dataFromTransactions?.otherIncome || 0,
      capitalGains: dataFromTransactions?.capitalGains || 0,
      standardDeduction,
      taxSavingInvestments: dataFromTransactions?.taxSavingInvestments || 0,
      healthInsurance: dataFromTransactions?.healthInsurance || 0,
    };

    // Auto-save if we have transaction data
    if (dataFromTransactions && dataFromTransactions.totalIncome > 0) {
      // Calculate tax for the default record
      const taxableIncome = Math.max(0, defaultRecord.totalIncome - defaultRecord.totalDeductions);
      const calculation = calculateTax(taxableIncome, defaultRecord.regime);
      defaultRecord.calculatedTax = calculation.totalTax;
      defaultRecord.effectiveRate = calculation.effectiveRate;
    }

    return defaultRecord;
  }, [records, currentFinancialYear, dataFromTransactions]);

  // Calculate tax when inputs change
  const taxCalculation = useMemo(() => {
    const taxableIncome = Math.max(0, currentRecord.totalIncome - currentRecord.totalDeductions);
    const result = calculateTax(taxableIncome, currentRecord.regime);
    return result;
  }, [currentRecord.totalIncome, currentRecord.totalDeductions, currentRecord.regime]);

  const regimeComparison = useMemo(() => {
    const taxableIncome = Math.max(0, currentRecord.totalIncome - currentRecord.totalDeductions);
    return compareRegimes(taxableIncome);
  }, [currentRecord.totalIncome, currentRecord.totalDeductions]);

  const handleInputChange = async (updates: Partial<TaxRecord>) => {
    const updatedRecord = { ...currentRecord, ...updates };
    
    // Recalculate
    const taxableIncome = Math.max(0, updatedRecord.totalIncome - updatedRecord.totalDeductions);
    const calculation = calculateTax(taxableIncome, updatedRecord.regime);
    
    updatedRecord.calculatedTax = calculation.totalTax;
    updatedRecord.effectiveRate = calculation.effectiveRate;

    // Update local state
    setRecords((prev) => {
      const existingIndex = prev.findIndex((r) => r.financialYear === currentFinancialYear);
      if (existingIndex >= 0) {
        const newRecords = [...prev];
        newRecords[existingIndex] = updatedRecord;
        return newRecords;
      }
      return [...prev, updatedRecord];
    });

    // Save to database
    try {
      if (currentRecord.id) {
        await updateTaxRecord(currentRecord.id, updatedRecord);
      } else {
        const newRecord = await createTaxRecord(updatedRecord);
        setRecords((prev) => {
          const existingIndex = prev.findIndex((r) => r.financialYear === currentFinancialYear);
          if (existingIndex >= 0) {
            const newRecords = [...prev];
            newRecords[existingIndex] = { ...updatedRecord, id: newRecord.id };
            return newRecords;
          }
          return [...prev, { ...updatedRecord, id: newRecord.id }];
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save tax record",
        variant: "destructive",
      });
    }
  };

  const previousYearRecord = useMemo(() => {
    const prevYear = parseInt(currentFinancialYear.split("-")[0]) - 1;
    const prevYearStr = `${prevYear - 1}-${prevYear.toString().slice(-2)}`;
    return records.find((r) => r.financialYear === prevYearStr);
  }, [records, currentFinancialYear]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 bg-gray-50 min-h-screen">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Income Tax</h1>
          <p className="text-gray-600 mt-1">Financial Year: {currentFinancialYear}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="inputs">Inputs</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-6">
            <TaxSummary
              record={currentRecord}
              calculation={taxCalculation}
              comparison={regimeComparison}
            />
          </TabsContent>

          <TabsContent value="charts" className="mt-6">
            <TaxCharts
              record={currentRecord}
              calculation={taxCalculation}
              previousYearRecord={previousYearRecord}
            />
          </TabsContent>

          <TabsContent value="inputs" className="mt-6">
            <TaxInputs
              record={currentRecord}
              onInputChange={handleInputChange}
              dataFromTransactions={dataFromTransactions}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

