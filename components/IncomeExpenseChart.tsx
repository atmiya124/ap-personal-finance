"use client";

import { BarChart, Bar, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { format, subDays, subMonths, subYears, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from "date-fns";
import { useState, useMemo } from "react";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Transaction {
  type: string;
  amount: number;
  date: Date | string;
}

interface IncomeExpenseChartProps {
  transactions: Transaction[];
  selectedYear?: number;
}

export function IncomeExpenseChart({ transactions, selectedYear }: IncomeExpenseChartProps) {
  const [duration, setDuration] = useState("This Year");
  const [chartType, setChartType] = useState("bar");
  const currentYear = new Date().getFullYear();
  const isCurrentYear = !selectedYear || selectedYear === currentYear;

  // Filter transactions based on duration and selected year
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    // If a specific year is selected, use that year's range
    if (selectedYear && selectedYear !== currentYear) {
      startDate = startOfYear(new Date(selectedYear, 0, 1));
      endDate = endOfYear(new Date(selectedYear, 11, 31));
    } else {
      // Otherwise, use duration-based filtering
      switch (duration) {
        case "This Week":
          startDate = startOfWeek(now);
          endDate = endOfWeek(now);
          break;
        case "This Month":
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case "This Year":
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          break;
        default:
          startDate = startOfYear(now);
          endDate = endOfYear(now);
      }
    }

    return transactions.filter((t) => {
      const date = typeof t.date === "string" ? new Date(t.date) : t.date;
      return isWithinInterval(date, { start: startDate, end: endDate });
    });
  }, [transactions, duration, selectedYear, currentYear]);

  // Group transactions based on duration
  const chartData = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {};
    
    filteredTransactions.forEach((t) => {
      const date = typeof t.date === "string" ? new Date(t.date) : t.date;
      let key: string;
      
      if (duration === "This Week") {
        key = format(date, "EEE"); // Day name
      } else if (duration === "This Month") {
        key = format(date, "MMM dd"); // Month day
      } else {
        key = format(date, "MMM yyyy"); // Month year
      }
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(t);
    });

    const data = Object.entries(grouped).map(([key, trans]) => {
      const income = trans
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = trans
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        key,
        income,
        expense,
      };
    });

    // Sort by date - need to handle different formats
    data.sort((a, b) => {
      // For past years, sort by month order
      if (selectedYear && selectedYear !== currentYear) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.indexOf(a.key) - months.indexOf(b.key);
      }
      // For This Week, sort by day of week
      if (duration === "This Week") {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days.indexOf(a.key) - days.indexOf(b.key);
      }
      // For other durations, try to parse as date
      const dateA = new Date(a.key);
      const dateB = new Date(b.key);
      // If parsing fails, compare strings
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return a.key.localeCompare(b.key);
      }
      return dateA.getTime() - dateB.getTime();
    });

    return data;
  }, [filteredTransactions, duration, selectedYear, currentYear]);

  const hasData = chartData.length > 0;

  // Calculate total for display
  const totalAmount = chartData.reduce((sum, d) => sum + d.income, 0);
  const totalExpense = chartData.reduce((sum, d) => sum + d.expense, 0);
  
  // Get title based on duration and selected year
  const getTitle = () => {
    if (selectedYear && selectedYear !== currentYear) {
      return `Earnings ${selectedYear}`;
    }
    switch (duration) {
      case "This Week":
        return "Earnings This Week";
      case "This Month":
        return "Earnings This Month";
      case "This Year":
        return "Earnings This Year";
      default:
        return "Earnings Overview";
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render chart based on chart type
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    if (chartType === "bar") {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="key"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="income"
            name="Income"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="expense"
            name="Expense"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      );
    } else if (chartType === "area") {
      return (
        <AreaChart {...commonProps}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="key"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="income"
            name="Income"
            stackId="1"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="expense"
            name="Expense"
            stackId="2"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.6}
          />
        </AreaChart>
      );
    } else {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="key"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="income"
            name="Income"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="expense"
            name="Expense"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 4 }}
          />
        </LineChart>
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{getTitle()}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {isCurrentYear && (
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="This Year">This Year</SelectItem>
                  <SelectItem value="This Month">This Month</SelectItem>
                  <SelectItem value="This Week">This Week</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
            <span className="text-gray-600">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
            <span className="text-gray-600">Expense</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div style={{ width: "100%", height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
            <FileText className="w-12 h-12 mb-2" />
            <p className="text-sm">No data available to display the chart.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
