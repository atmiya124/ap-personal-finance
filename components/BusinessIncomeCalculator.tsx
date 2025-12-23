"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { DollarSign, Percent, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Account {
  id: string;
  name: string;
  type: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
  icon?: string | null;
  color?: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: Date;
  accountId: string;
  categoryId: string | null;
  category: Category | null;
}

interface BusinessIncomeCalculatorProps {
  accounts: Account[];
  transactions: Transaction[];
}

export function BusinessIncomeCalculator({ accounts, transactions }: BusinessIncomeCalculatorProps) {
  // Load rates from localStorage on mount
  const getStoredIncomeTaxRate = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("businessIncomeTaxRate");
      return stored ? parseFloat(stored) : 11.5;
    }
    return 11.5;
  };

  const getStoredGstHstRate = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("businessGstHstRate");
      return stored ? parseFloat(stored) : 13;
    }
    return 13;
  };

  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [totalBusinessIncome, setTotalBusinessIncome] = useState<number>(0);
  const [incomeTaxRate, setIncomeTaxRate] = useState<number>(getStoredIncomeTaxRate);
  const [gstHstRate, setGstHstRate] = useState<number>(getStoredGstHstRate);
  const [isManualEdit, setIsManualEdit] = useState<boolean>(false);
  const prevAccountIdRef = useRef<string>(selectedAccountId);

  // Filter transactions by selected account and type (income only)
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter((t) => t.type === "income");
    
    if (selectedAccountId !== "all") {
      filtered = filtered.filter((t) => t.accountId === selectedAccountId);
    }
    
    return filtered;
  }, [transactions, selectedAccountId]);

  // Calculate income by category
  const incomeByCategory = useMemo(() => {
    const categoryMap = new Map<string, { name: string; amount: number; icon?: string | null; color?: string }>();
    
    filteredTransactions.forEach((t) => {
      const categoryName = t.category?.name || "Uncategorized";
      const categoryId = t.categoryId || "uncategorized";
      
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          name: categoryName,
          amount: 0,
          icon: t.category?.icon || null,
          color: t.category?.color || "#3B82F6",
        });
      }
      
      const existing = categoryMap.get(categoryId)!;
      existing.amount += t.amount;
    });
    
    return Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  // Calculate total income from transactions
  const calculatedIncome = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  // Update total business income when account changes
  useEffect(() => {
    // Check if account actually changed
    const accountChanged = prevAccountIdRef.current !== selectedAccountId;
    if (accountChanged) {
      prevAccountIdRef.current = selectedAccountId;
      setIsManualEdit(false);
    }
    // Always sync with calculated income when account changed or not manually edited
    if (accountChanged || !isManualEdit) {
      setTotalBusinessIncome(calculatedIncome);
    }
  }, [selectedAccountId, calculatedIncome, isManualEdit]);

  // Calculations
  const incomeTax = useMemo(() => {
    return (totalBusinessIncome * incomeTaxRate) / 100;
  }, [totalBusinessIncome, incomeTaxRate]);

  const gstHst = useMemo(() => {
    return (totalBusinessIncome * gstHstRate) / 100;
  }, [totalBusinessIncome, gstHstRate]);

  const netIncome = useMemo(() => {
    return totalBusinessIncome - incomeTax - gstHst;
  }, [totalBusinessIncome, incomeTax, gstHst]);

  const totalObligations = useMemo(() => {
    return incomeTax + gstHst;
  }, [incomeTax, gstHst]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Input and Rate Adjustment Section */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-select" className="text-base font-medium">
              Select Account
            </Label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger id="account-select" className="w-full">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="total-income" className="text-base font-medium">
              Total Business Income
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="total-income"
                type="number"
                value={totalBusinessIncome}
                onChange={(e) => {
                  setIsManualEdit(true);
                  setTotalBusinessIncome(parseFloat(e.target.value) || 0);
                }}
                className="pl-10 text-lg"
                placeholder="0"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Update this value to see real-time calculations
            </p>
          </div>

          {/* Category Breakdown */}
          {incomeByCategory.length > 0 && (
            <div className="space-y-2">
              <Label className="text-base font-medium">Income by Category</Label>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {incomeByCategory.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {cat.icon && <span>{cat.icon}</span>}
                      <span className="font-medium">{cat.name}</span>
                    </div>
                    <span className="font-semibold" style={{ color: cat.color }}>
                      {formatCurrency(cat.amount, "CAD")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Income Tax Rate</Label>
              <span className="text-lg font-semibold text-blue-600">{incomeTaxRate}%</span>
            </div>
            <Slider
              value={[incomeTaxRate]}
              onValueChange={(value) => {
                const newRate = value[0];
                setIncomeTaxRate(newRate);
                if (typeof window !== "undefined") {
                  localStorage.setItem("businessIncomeTaxRate", newRate.toString());
                }
              }}
              min={0}
              max={50}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Drag to adjust (0% - 50%)</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">GST/HST Rate</Label>
              <span className="text-lg font-semibold text-orange-600">{gstHstRate}%</span>
            </div>
            <Slider
              value={[gstHstRate]}
              onValueChange={(value) => {
                const newRate = value[0];
                setGstHstRate(newRate);
                if (typeof window !== "undefined") {
                  localStorage.setItem("businessGstHstRate", newRate.toString());
                }
              }}
              min={0}
              max={20}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Drag to adjust (0% - 20%)</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm font-medium text-muted-foreground">GROSS INCOME</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(totalBusinessIncome, "CAD")}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedAccountId === "all" ? "From all accounts" : `From ${selectedAccount?.name || "account"}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                INCOME TAX ({incomeTaxRate}%)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(incomeTax, "CAD")}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Tax liability</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                GST/HST ({gstHstRate}%)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {formatCurrency(gstHst, "CAD")}
            </div>
            <p className="text-xs text-muted-foreground mt-2">To remit to CRA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <CardTitle className="text-sm font-medium text-muted-foreground">NET INCOME</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(netIncome, "CAD")}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Income - GST/HST</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Calculation */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Calculation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium">Gross Business Income</span>
            <span className="text-sm font-semibold text-blue-600">
              {formatCurrency(totalBusinessIncome, "CAD")}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium">
              Less: Income Tax ({incomeTaxRate}% federal + provincial)
            </span>
            <span className="text-sm font-semibold text-blue-600">
              -{formatCurrency(incomeTax, "CAD")}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium">
              Less: GST/HST ({gstHstRate}% collected, must remit to CRA)
            </span>
            <span className="text-sm font-semibold text-orange-600">
              -{formatCurrency(gstHst, "CAD")}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-2 bg-green-50 rounded-md px-3">
            <span className="text-sm font-medium">Net Income After GST/HST</span>
            <span className="text-sm font-semibold text-green-600">
              {formatCurrency(netIncome, "CAD")}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-t pt-3">
            <span className="text-sm font-medium">Total Obligations (Income Tax + GST/HST)</span>
            <span className="text-sm font-semibold text-red-600">
              {formatCurrency(totalObligations, "CAD")}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

