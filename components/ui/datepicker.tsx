"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  mode?: "month" | "date";
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disabled,
  mode = "date",
}: DatePickerProps) {
  // For month selection, only allow picking the first day of the month
  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate && mode === "month") {
      onDateChange(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    } else {
      onDateChange(selectedDate);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={"w-full justify-start text-left font-normal h-11 " + (className || "")}
          disabled={disabled}
          type="button"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (mode === "month" ? format(date, "MMM yyyy") : format(date, "PPP")) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          disabled={(d) => d > new Date()} // Disable future dates
          captionLayout={mode === "month" ? "dropdown" : "label"}
          // Only show month/year dropdown if mode is month
          showOutsideDays={mode !== "month"}
        />
      </PopoverContent>
    </Popover>
  );
}
