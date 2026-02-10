"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo } from "react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DEFAULT_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316",
];

type Transaction = {
  type: string;
  amount: number;
  date: Date | string;
  category: { name: string; type: string; color: string } | null;
};

type OverviewData = {
  transactions: Transaction[];
  month: number;
  year: number;
  monthName: string;
  availableYears: number[];
};

export function OverviewClient({
  initialData,
  availableYears,
}: {
  initialData: OverviewData;
  availableYears: number[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const month = initialData.month;
  const year = initialData.year;
  const monthName = initialData.monthName;
  const transactions = initialData.transactions;

  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );
  const totalExpense = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );
  const gross = totalIncome - totalExpense;

  const incomeByCategory = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> = {};
    transactions
      .filter((t) => t.type === "income" && t.category)
      .forEach((t) => {
        const name = t.category!.name;
        if (!map[name]) {
          map[name] = {
            name,
            value: 0,
            color: t.category!.color || DEFAULT_COLORS[Object.keys(map).length % DEFAULT_COLORS.length],
          };
        }
        map[name].value += t.amount;
      });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> = {};
    transactions
      .filter((t) => t.type === "expense" && t.category)
      .forEach((t) => {
        const name = t.category!.name;
        if (!map[name]) {
          map[name] = {
            name,
            value: 0,
            color: t.category!.color || DEFAULT_COLORS[Object.keys(map).length % DEFAULT_COLORS.length],
          };
        }
        map[name].value += t.amount;
      });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const cashflowData = useMemo(() => {
    const byWeek: Record<string, { income: number; expense: number }> = {};
    transactions.forEach((t) => {
      const d = typeof t.date === "string" ? new Date(t.date) : t.date;
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      if (!byWeek[key]) byWeek[key] = { income: 0, expense: 0 };
      if (t.type === "income") byWeek[key].income += t.amount;
      else if (t.type === "expense") byWeek[key].expense += t.amount;
    });
    const arr = Object.entries(byWeek)
      .map(([key, v]) => ({ key, income: v.income, expense: v.expense }))
      .sort((a, b) => {
        const [ma, da] = a.key.split("/").map(Number);
        const [mb, db] = b.key.split("/").map(Number);
        return ma !== mb ? ma - mb : da - db;
      });
    if (arr.length === 0 && transactions.length > 0) {
      const totalIncomeVal = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const totalExpenseVal = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      arr.push({ key: monthName, income: totalIncomeVal, expense: totalExpenseVal });
    }
    return arr;
  }, [transactions, monthName]);

  const setMonthYear = (newMonth: number, newYear: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", String(newMonth));
    params.set("year", String(newYear));
    router.push(`/overview?${params.toString()}`);
    router.refresh();
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    const total = p.payload.total as number;
    const pct = total ? ((p.value / total) * 100).toFixed(1) : "0";
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">{p.name}</p>
        <p className="text-sm text-gray-600">
          {formatCurrency(p.value)} ({pct}%)
        </p>
      </div>
    );
  };

  const incomePieData = incomeByCategory.map((c) => ({
    ...c,
    total: totalIncome,
  }));
  const expensePieData = expenseByCategory.map((c) => ({
    ...c,
    total: totalExpense,
  }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Overview{" "}
          <span className="italic font-bold text-purple-600">{monthName}</span>
        </h1>
        <div className="flex items-center gap-3">
          <Select
            value={String(month)}
            onValueChange={(v) => setMonthYear(parseInt(v, 10), year)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((name, i) => (
                <SelectItem key={name} value={String(i + 1)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(year)}
            onValueChange={(v) => setMonthYear(month, parseInt(v, 10))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-500">Income</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-600">
              {formatCurrency(totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-500">Expense</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-red-600">
              {formatCurrency(totalExpense)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-500">Gross</h3>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-semibold ${
                gross >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(gross)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Cashflow</h2>
          <p className="text-sm text-gray-500">Income vs Expense</p>
        </CardHeader>
        <CardContent>
          {cashflowData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="key" />
                  <YAxis tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 py-8 text-center">No cashflow data for this month.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Income by category</h2>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 min-h-[240px]">
                {incomePieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={incomePieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {incomePieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-8">No income data</p>
                )}
              </div>
              <div className="flex-1 space-y-1">
                {incomeByCategory.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between text-sm py-1 border-b border-gray-100"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </span>
                    <span className="font-medium">{formatCurrency(c.value)}</span>
                  </div>
                ))}
                {incomeByCategory.length === 0 && (
                  <p className="text-gray-500 text-sm">No categories</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Expense by category</h2>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 min-h-[240px]">
                {expensePieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {expensePieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-8">No expense data</p>
                )}
              </div>
              <div className="flex-1 space-y-1">
                {expenseByCategory.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between text-sm py-1 border-b border-gray-100"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </span>
                    <span className="font-medium">{formatCurrency(c.value)}</span>
                  </div>
                ))}
                {expenseByCategory.length === 0 && (
                  <p className="text-gray-500 text-sm">No categories</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
