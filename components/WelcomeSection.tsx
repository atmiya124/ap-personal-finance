"use client";

import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/DateRangePicker";

interface WelcomeSectionProps {
  userName?: string;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  onAccountChange?: (account: string) => void;
  initialDateRange?: DateRange;
}

export function WelcomeSection({ 
  userName = "Atmiya",
  onDateRangeChange,
  onAccountChange,
  initialDateRange,
}: WelcomeSectionProps) {
  const [selectedAccount, setSelectedAccount] = useState("All Accounts");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (initialDateRange) {
      return initialDateRange;
    }
    // Default to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return {
      from: thirtyDaysAgo,
      to: today,
    };
  });

  useEffect(() => {
    if (initialDateRange) {
      setDateRange(initialDateRange);
    }
  }, [initialDateRange]);

  const handleAccountChange = (value: string) => {
    setSelectedAccount(value);
    if (onAccountChange) {
      onAccountChange(value);
    }
  };

  return (
    <div className="bg-blue-600 text-white">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h2 className="text-3xl font-semibold mb-2">
            Welcome Back, {userName} 👋
          </h2>
          <p className="text-blue-100">This is your Financial Overview report</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedAccount} onValueChange={handleAccountChange}>
            <SelectTrigger className="w-[180px] bg-blue-700 hover:bg-blue-800 border-blue-600 text-white">
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Accounts">All Accounts</SelectItem>
              <SelectItem value="Bank Accounts">Bank Accounts</SelectItem>
              <SelectItem value="Credit Cards">Credit Cards</SelectItem>
            </SelectContent>
          </Select>
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={(range) => {
              setDateRange(range);
              if (onDateRangeChange) {
                onDateRangeChange(range);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
