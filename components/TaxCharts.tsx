"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

// Helper to format currency (default CAD)
const formatMoney = (amount: number) => formatCurrency(amount, "CAD");
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import type { TaxCalculationResult } from "@/lib/tax-calculator";

interface TaxChartsProps {
  record: any;
  calculation: TaxCalculationResult;
  previousYearRecord?: any;
}

const COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B"];

export function TaxCharts({ record, calculation, previousYearRecord }: TaxChartsProps) {
  // Chart 1: Income vs Tax (Bar Chart)
  const incomeVsTaxData = [
    {
      name: "Income",
      value: record.totalIncome,
    },
    {
      name: "Tax",
      value: calculation.totalTax,
    },
  ];

  // Chart 2: Tax Breakdown (Pie Chart)
  const taxBreakdownData = [
    {
      name: "Base Tax",
      value: calculation.baseTax,
    },
    {
      name: "Cess (4%)",
      value: calculation.cess,
    },
  ];

  // Chart 3: Year Comparison (if previous year exists)
  const yearComparisonData = previousYearRecord
    ? [
        {
          year: previousYearRecord.financialYear,
          tax: previousYearRecord.calculatedTax || 0,
        },
        {
          year: record.financialYear,
          tax: calculation.totalTax,
        },
      ]
    : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Tax Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Income vs Tax</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incomeVsTaxData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatMoney(value)}
                  labelStyle={{ color: "#000" }}
                />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tax Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taxBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taxBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatMoney(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Year Comparison Chart (if available) */}
      {yearComparisonData && (
        <Card>
          <CardHeader>
            <CardTitle>Year Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatMoney(value)}
                  labelStyle={{ color: "#000" }}
                />
                <Bar dataKey="tax" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {!yearComparisonData && (
        <Card>
          <CardHeader>
            <CardTitle>Year Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              No previous year data available for comparison
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

