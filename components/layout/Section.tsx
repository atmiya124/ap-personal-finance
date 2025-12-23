"use client";

import { cn } from "@/lib/utils";
import { UI_CONSTANTS } from "@/lib/ui-constants";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  spacing?: "none" | "sm" | "md" | "lg" | "xl";
  background?: "default" | "muted" | "accent";
}

const spacingMap = {
  none: "0",
  sm: "1rem",
  md: UI_CONSTANTS.dashboard.sectionSpacing,
  lg: "3rem",
  xl: "4rem",
};

const backgroundMap = {
  default: "bg-white",
  muted: "bg-gray-50",
  accent: "bg-blue-50",
};

/**
 * Section Component
 * 
 * Provides consistent spacing and background for page sections.
 * Easy to update by changing spacing or background props.
 */
export function Section({
  children,
  className,
  spacing = "md",
  background = "default",
}: SectionProps) {
  return (
    <section
      className={cn(
        backgroundMap[background],
        spacing !== "none" && `py-${spacing === "sm" ? "4" : spacing === "md" ? "8" : spacing === "lg" ? "12" : "16"}`,
        className
      )}
      style={spacing !== "none" ? { paddingTop: spacingMap[spacing], paddingBottom: spacingMap[spacing] } : undefined}
    >
      {children}
    </section>
  );
}

