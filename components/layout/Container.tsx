"use client";

import { cn } from "@/lib/utils";
import { UI_CONSTANTS } from "@/lib/ui-constants";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: keyof typeof UI_CONSTANTS.layout.maxWidth;
  padding?: boolean;
}

/**
 * Container Component
 * 
 * Wraps content with consistent max-width and padding.
 * Easy to update layout by changing maxWidth prop or UI_CONSTANTS.
 */
const maxWidthClasses: Record<keyof typeof UI_CONSTANTS.layout.maxWidth, string> = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
};

export function Container({
  children,
  className,
  maxWidth = "xl",
  padding = true,
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        maxWidthClasses[maxWidth],
        padding && "px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      {children}
    </div>
  );
}

