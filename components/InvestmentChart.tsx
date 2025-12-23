"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Investment {
  id: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
}

interface InvestmentChartProps {
  investments: Investment[];
}

export function InvestmentChart({ investments }: InvestmentChartProps) {
  const chartData = investments.map((inv) => ({
    name: inv.name,
    cost: inv.quantity * inv.purchasePrice,
    value: inv.quantity * inv.currentPrice,
    gain: inv.quantity * inv.currentPrice - inv.quantity * inv.purchasePrice,
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-600">Investment Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} fontSize={10} />
            <YAxis fontSize={10} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            <Bar dataKey="cost" fill="#94a3b8" name="Cost Basis" />
            <Bar dataKey="value" fill="#3b82f6" name="Current Value" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
