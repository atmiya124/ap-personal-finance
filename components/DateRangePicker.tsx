"use client";

import * as React from "react";
import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange | undefined>(dateRange);

  // Sync tempRange with dateRange prop
  React.useEffect(() => {
    setTempRange(dateRange);
  }, [dateRange]);

  const handleSelect = (range: DateRange | undefined) => {
    setTempRange(range);
    // Only close and apply when both dates are selected
    if (range?.from && range?.to) {
      onDateRangeChange(range);
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempRange(undefined);
    onDateRangeChange(undefined);
    setIsOpen(false);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[280px] sm:w-[320px] justify-start text-left font-normal bg-white hover:bg-gray-50 border-gray-200 text-gray-900 shadow-sm h-10",
              !dateRange && "text-gray-500"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "MMM dd, yyyy")} -{" "}
                  {format(dateRange.to, "MMM dd, yyyy")}
                </>
              ) : (
                format(dateRange.from, "MMM dd, yyyy")
              )
            ) : (
              <span>Pick a date range</span>
            )}
            {dateRange?.from && dateRange?.to && (
              <X
                className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
          <div className="p-3 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Select Date Range</p>
                <p className="text-xs text-gray-500 mt-1">
                  {!tempRange?.from
                    ? "Select start date"
                    : !tempRange?.to
                    ? "Select end date"
                    : "Date range selected"}
                </p>
              </div>
              {tempRange?.from && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-7 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
            {tempRange?.from && (
              <div className="mt-2 flex gap-4 text-xs">
                <div>
                  <span className="text-gray-500">From:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {format(tempRange.from, "MMM dd, yyyy")}
                  </span>
                </div>
                {tempRange.to && (
                  <div>
                    <span className="text-gray-500">To:</span>{" "}
                    <span className="font-medium text-gray-900">
                      {format(tempRange.to, "MMM dd, yyyy")}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={tempRange?.from || dateRange?.from}
            selected={tempRange || dateRange}
            onSelect={handleSelect}
            numberOfMonths={2}
            className="rounded-md"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
