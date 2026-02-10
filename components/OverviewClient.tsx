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
  LabelList,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  const cashflowData = useMemo(
    () => [
      { name: "Income", value: totalIncome, fill: "#10B981" },
      { name: "Expense", value: totalExpense, fill: "#EF4444" },
    ],
    [totalIncome, totalExpense]
  );

  const setMonthYear = (newMonth: number, newYear: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", String(newMonth));
    params.set("year", String(newYear));
    router.push(`/overview?${params.toString()}`);
    router.refresh();
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

  const splitLegend = (data: { name: string; color: string }[]) => {
    const mid = Math.ceil(data.length / 2);
    return { left: data.slice(0, mid), right: data.slice(mid) };
  };
  const incomeLegend = splitLegend(incomePieData);
  const expenseLegend = splitLegend(expensePieData);

  const LegendColumn = ({ items }: { items: { name: string; color: string }[] }) => (
    <div className="flex flex-col gap-1.5 justify-center">
      {items.map((c) => (
        <div key={c.name} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: c.color }}
          />
          <span className="text-sm text-foreground">{c.name}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight text-green-600">
              {formatCurrency(totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight text-red-600">
              {formatCurrency(totalExpense)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gross</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-semibold tracking-tight ${
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
          <CardTitle className="text-lg">Cashflow</CardTitle>
          <p className="text-sm text-muted-foreground">Income vs Expense</p>
        </CardHeader>
        <CardContent>
          {(totalIncome > 0 || totalExpense > 0) ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cashflowData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 14 }} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), ""]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={56}>
                    <LabelList
                      dataKey="value"
                      position="right"
                      formatter={(v: number) => formatCurrency(v)}
                      className="fill-foreground text-sm font-medium"
                    />
                    {cashflowData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-sm">No cashflow data for this month.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Income by category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {incomePieData.length > 0 ? (
                <>
                  <div className="flex items-center gap-4 w-full h-[220px]">
                    <LegendColumn items={incomeLegend.left} />
                    <div className="flex-1 min-w-[180px] h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={incomePieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={56}
                            outerRadius={88}
                            paddingAngle={2}
                            stroke="none"
                          >
                            {incomePieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <LegendColumn items={incomeLegend.right} />
                  </div>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-semibold">Category</TableHead>
                          <TableHead className="text-right font-semibold">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {incomeByCategory.map((c) => (
                          <TableRow key={c.name}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell className="text-right tabular-nums text-green-600">
                              {formatCurrency(c.value)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">No income data</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Expense by category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {expensePieData.length > 0 ? (
                <>
                  <div className="flex items-center gap-4 w-full h-[220px]">
                    <LegendColumn items={expenseLegend.left} />
                    <div className="flex-1 min-w-[180px] h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expensePieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={56}
                            outerRadius={88}
                            paddingAngle={2}
                            stroke="none"
                          >
                            {expensePieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <LegendColumn items={expenseLegend.right} />
                  </div>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-semibold">Category</TableHead>
                          <TableHead className="text-right font-semibold">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenseByCategory.map((c) => (
                          <TableRow key={c.name}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell className="text-right tabular-nums text-red-600">
                              {formatCurrency(c.value)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">No expense data</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
