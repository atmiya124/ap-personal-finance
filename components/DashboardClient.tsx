"use client";

import { useState, useEffect, useCallback } from "react";
import * as React from "react";
import { DateRange } from "react-day-picker";
import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "next/navigation";
import { DashboardSummary } from "@/components/DashboardSummary";
import { IncomeExpenseChart } from "@/components/IncomeExpenseChart";
import { CategorySpendingChart } from "@/components/CategorySpendingChart";
import { RecentTransactions } from "@/components/RecentTransactions";
import { UpcomingSubscriptions } from "@/components/UpcomingSubscriptions";
import { AccountsCard } from "@/components/AccountsCard";
import { YearSelector } from "@/components/YearSelector";
import { format } from "date-fns";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  payee: string | null;
  date: Date | string;
  account: { id: string; name: string; type: string };
  category: { id: string; name: string; color: string } | null;
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  dueDate: number | null;
  type: string;
  isActive: boolean;
  payments: Array<{
    id: string;
    paidDate: Date | string;
    isPaid: boolean;
  }>;
}

interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface DashboardClientProps {
  initialData: {
    user: User;
    totalIncome: number;
    totalExpenses: number;
    remainingBalance: number;
    transactions: Transaction[];
    subscriptions: Subscription[];
    accounts: Account[];
    categories: Category[];
  };
  availableYears: number[];
}

export function DashboardClient({ initialData, availableYears }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState(initialData);
  const [filteredAccounts, setFilteredAccounts] = useState<string>("All Accounts");
  const currentYear = new Date().getFullYear();

  // Update data when initialData changes (after router refresh)
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Get date range from URL or use default
  const getDateRange = useCallback((): DateRange => {
    if (searchParams.get("from") && searchParams.get("to")) {
      return {
        from: new Date(searchParams.get("from")!),
        to: new Date(searchParams.get("to")!),
      };
    } else {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      return {
        from: thirtyDaysAgo,
        to: today,
      };
    }
  }, [searchParams]);

  const [dateRange, setDateRange] = useState<DateRange>(getDateRange());

  // Update date range when URL params change
  useEffect(() => {
    setDateRange(getDateRange());
  }, [searchParams, getDateRange]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      const params = new URLSearchParams();
      params.set("from", format(range.from, "yyyy-MM-dd"));
      params.set("to", format(range.to, "yyyy-MM-dd"));
      router.push(`/dashboard?${params.toString()}`);
      router.refresh();
    } else {
      // Clear date range filter
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleAccountChange = (account: string) => {
    setFilteredAccounts(account);
  };

  // Filter transactions by account
  let filteredTransactions = data.transactions;
  if (filteredAccounts !== "All Accounts") {
    filteredTransactions = data.transactions.filter((t) => {
      if (filteredAccounts === "Bank Accounts") {
        return t.account.type === "bank" || t.account.type === "savings";
      }
      if (filteredAccounts === "Credit Cards") {
        return t.account.type === "credit_card";
      }
      return true;
    });
  }

  // Recalculate totals based on filtered transactions
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate previous period data for percentage comparison
  const calculatePreviousPeriod = () => {
    if (!dateRange?.from || !dateRange?.to) {
      return { income: 0, expenses: 0, balance: 0 };
    }

    const currentFrom = new Date(dateRange.from);
    const currentTo = new Date(dateRange.to);
    const periodDuration = currentTo.getTime() - currentFrom.getTime();

    // Calculate previous period dates
    const previousTo = new Date(currentFrom);
    previousTo.setTime(previousTo.getTime() - 1); // One day before current period starts
    const previousFrom = new Date(previousTo);
    previousFrom.setTime(previousFrom.getTime() - periodDuration);

    // Filter transactions for previous period
    const previousTransactions = data.transactions.filter((t) => {
      const transactionDate = typeof t.date === "string" ? new Date(t.date) : t.date;
      return transactionDate >= previousFrom && transactionDate <= previousTo;
    });

    // Apply account filter if needed
    let filteredPreviousTransactions = previousTransactions;
    if (filteredAccounts !== "All Accounts") {
      filteredPreviousTransactions = previousTransactions.filter((t) => {
        if (filteredAccounts === "Bank Accounts") {
          return t.account.type === "bank" || t.account.type === "savings";
        }
        if (filteredAccounts === "Credit Cards") {
          return t.account.type === "credit_card";
        }
        return true;
      });
    }

    const previousIncome = filteredPreviousTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const previousExpenses = filteredPreviousTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // For balance, we'll use the account balance which doesn't change based on period
    // So we'll compare current balance with itself (0% change)
    const previousBalance = data.remainingBalance;

    return { income: previousIncome, expenses: previousExpenses, balance: previousBalance };
  };

  const previousPeriod = calculatePreviousPeriod();

  // Calculate percentage changes
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  };

  const incomeChange = calculatePercentageChange(totalIncome, previousPeriod.income);
  const expensesChange = calculatePercentageChange(totalExpenses, previousPeriod.expenses);
  const balanceChange = calculatePercentageChange(data.remainingBalance, previousPeriod.balance);

  const dateRangeString = dateRange?.from && dateRange?.to
    ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`
    : "All Time";

  // Get selected year from URL or use current year
  const selectedYear = searchParams.get("year") 
    ? parseInt(searchParams.get("year")!) 
    : currentYear;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Year Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedYear === currentYear ? "Dashboard" : `Dashboard - ${selectedYear}`}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {selectedYear === currentYear 
                ? `January ${selectedYear} - December ${selectedYear}`
                : `Viewing data for ${selectedYear}`
              }
            </p>
          </div>
          <YearSelector 
            availableYears={availableYears} 
            currentYear={currentYear}
          />
        </div>
         
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Row - Summary Cards and My Account */}
         
          {/* Left Column - Income/Expense Chart and Recent Transactions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="lg:col-span-3">
              <DashboardSummary
                income={totalIncome}
                expenses={totalExpenses}
                balance={data.remainingBalance}
                currency={data.user.currency}
                incomeChange={incomeChange}
                expensesChange={expensesChange}
                balanceChange={balanceChange}
              />
            </div>
            <IncomeExpenseChart 
              transactions={filteredTransactions}
              selectedYear={selectedYear}
            />
            <RecentTransactions 
              transactions={filteredTransactions}
              accounts={data.accounts}
              categories={data.categories}
              isCurrentYear={selectedYear === currentYear}
            />
          </div>

          {/* Right Column - Top Spending Category and Upcoming Subscriptions */}
          <div className="space-y-6">
             {/* My Account - Moved Up */}
            <div>
              <AccountsCard accounts={data.accounts} />
            </div>
            <CategorySpendingChart transactions={filteredTransactions} />
            <UpcomingSubscriptions subscriptions={data.subscriptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

