"use client";

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface Transaction {
  type: string;
  amount: number;
  category: {
    name: string;
    color: string;
  } | null;
}

interface CategorySpendingChartProps {
  transactions: Transaction[];
}

const DEFAULT_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
];

export function CategorySpendingChart({ transactions }: CategorySpendingChartProps) {
  const [chartType, setChartType] = useState("Donut Chart");

  // Filter only expense transactions with categories
  const expenses = transactions.filter((t) => t.type === "expense" && t.category);

  // Calculate totals by category
  const categoryTotals = expenses.reduce((acc, t) => {
    const catName = t.category?.name || "Uncategorized";
    if (!acc[catName]) {
      acc[catName] = {
        name: catName,
        value: 0,
        color: t.category?.color || DEFAULT_COLORS[Object.keys(acc).length % DEFAULT_COLORS.length],
      };
    }
    acc[catName].value += t.amount;
    return acc;
  }, {} as Record<string, { name: string; value: number; color: string }>);

  // Sort by value (descending) and take top categories
  const sortedCategories = Object.values(categoryTotals)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); // Show top 6 categories

  const hasData = sortedCategories.length > 0;

  // Calculate total for percentage display
  const totalExpenses = sortedCategories.reduce((sum, cat) => sum + cat.value, 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / totalExpenses) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {formatCurrency(data.value)} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label function for donut chart
  const renderLabel = (entry: any) => {
    const percentage = ((entry.value / totalExpenses) * 100).toFixed(0);
    return `${percentage}%`;
  };

  // Prepare data for radar chart
  const radarData = sortedCategories.map((cat) => ({
    category: cat.name,
    value: cat.value,
    fullMark: Math.max(...sortedCategories.map((c) => c.value)) * 1.2, // Add 20% padding
  }));

  // Prepare data for radial chart
  const radialData = sortedCategories.map((cat) => ({
    name: cat.name,
    value: cat.value,
    fill: cat.color,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Top Spending Categories</h2>
            <p className="text-sm text-gray-500 mt-1">
              Showing top {sortedCategories.length} expense categories
            </p>
          </div>
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Donut Chart">Donut Chart</SelectItem>
              <SelectItem value="Radar Chart">Radar Chart</SelectItem>
              <SelectItem value="Radial Chart">Radial Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-4">
            {/* Donut Chart */}
            {chartType === "Donut Chart" && (
              <>
                <div style={{ width: "100%", height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sortedCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderLabel}
                      outerRadius={100}
                      innerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {sortedCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {sortedCategories.map((category, index) => {
                    const percentage = ((category.value / totalExpenses) * 100).toFixed(1);
                    return (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-gray-700 truncate">{category.name}</span>
                        <span className="text-gray-500 ml-auto">
                          {formatCurrency(category.value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Radar Chart */}
            {chartType === "Radar Chart" && (
              <>
                <div style={{ width: "100%", height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis 
                      dataKey="category" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 'dataMax']}
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                    />
                    <Radar
                      name="Spending"
                      dataKey="value"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.6}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                              <p className="font-semibold text-gray-900">{data.payload.category}</p>
                              <p className="text-sm text-gray-600">
                                {formatCurrency(data.value as number)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                  </RadarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {sortedCategories.map((category, index) => {
                    const percentage = ((category.value / totalExpenses) * 100).toFixed(1);
                    return (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-gray-700 truncate">{category.name}</span>
                        <span className="text-gray-500 ml-auto">
                          {formatCurrency(category.value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Radial Chart */}
            {chartType === "Radial Chart" && (
              <>
                <div style={{ width: "100%", height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="20%"
                    outerRadius="80%"
                    data={radialData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar
                      dataKey="value"
                      cornerRadius={4}
                      fill="#8884d8"
                    >
                      {radialData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </RadialBar>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          const percentage = ((data.value as number / totalExpenses) * 100).toFixed(1);
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                              <p className="font-semibold text-gray-900">{data.payload.name}</p>
                              <p className="text-sm text-gray-600">
                                {formatCurrency(data.value as number)} ({percentage}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                  </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {sortedCategories.map((category, index) => {
                    const percentage = ((category.value / totalExpenses) * 100).toFixed(1);
                    return (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-gray-700 truncate">{category.name}</span>
                        <span className="text-gray-500 ml-auto">
                          {formatCurrency(category.value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
            <FileText className="w-12 h-12 mb-2" />
            <p className="text-sm">No expense data available to display the chart.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
