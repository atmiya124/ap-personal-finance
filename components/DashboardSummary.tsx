import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardSummaryProps {
  income: number;
  expenses: number;
  balance: number;
  currency: string;
  incomeChange?: number;
  expensesChange?: number;
  balanceChange?: number;
}

export function DashboardSummary({
  income,
  expenses,
  balance,
  currency,
  incomeChange = 0,
  expensesChange = 0,
  balanceChange = 0,
}: DashboardSummaryProps) {
  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? "++" : "";
    return `${sign}${Math.abs(value).toFixed(0)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Income Card */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Income</h3>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {formatCurrency(income, currency)}
          </p>
          <p className="text-sm text-green-600 font-medium">
            {formatPercentage(incomeChange)} Since Last Week
          </p>
        </CardContent>
      </Card>

      {/* Total Expense Card */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Expense</h3>
            <TrendingDown className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {formatCurrency(expenses, currency)}
          </p>
          <p className="text-sm text-red-600 font-medium">
            {formatPercentage(expensesChange)} Since Last Week
          </p>
        </CardContent>
      </Card>

      {/* Total Savings Card */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Savings</h3>
            <PiggyBank className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {formatCurrency(balance, currency)}
          </p>
          <p className="text-sm text-green-600 font-medium">
            {formatPercentage(balanceChange)} Since Last Week
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
