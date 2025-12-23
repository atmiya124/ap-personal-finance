"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface YearSelectorProps {
  availableYears: number[];
  currentYear: number;
}

export function YearSelector({ availableYears, currentYear }: YearSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());

  // Get year from URL or use current year
  useEffect(() => {
    const yearParam = searchParams.get("year");
    if (yearParam) {
      setSelectedYear(yearParam);
    } else {
      setSelectedYear(currentYear.toString());
    }
  }, [searchParams, currentYear]);

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    const params = new URLSearchParams(searchParams.toString());
    
    if (year && year !== currentYear.toString()) {
      params.set("year", year);
      
      // Set date range for the selected year (Jan 1 to Dec 31)
      const selectedYearNum = parseInt(year);
      const yearStart = new Date(selectedYearNum, 0, 1);
      const yearEnd = new Date(selectedYearNum, 11, 31, 23, 59, 59, 999);
      
      params.set("from", yearStart.toISOString().split("T")[0]);
      params.set("to", yearEnd.toISOString().split("T")[0]);
    } else {
      // If current year, clear year param but keep date range for current year
      params.delete("year");
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      params.set("from", yearStart.toISOString().split("T")[0]);
      params.set("to", yearEnd.toISOString().split("T")[0]);
    }
    
    router.push(`/dashboard?${params.toString()}`);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
        Year:
      </label>
      <Select value={selectedYear} onValueChange={handleYearChange}>
        <SelectTrigger id="year-select" className="w-[140px]">
          <SelectValue placeholder="Select year" />
        </SelectTrigger>
        <SelectContent>
          {availableYears.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

