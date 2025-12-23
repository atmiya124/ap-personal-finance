"use client";

import { cn } from "@/lib/utils";
import { UI_CONSTANTS } from "@/lib/ui-constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  variant?: "default" | "outlined" | "elevated";
}

const variantStyles = {
  default: "bg-white border border-gray-200",
  outlined: "bg-white border-2 border-gray-300",
  elevated: "bg-white shadow-lg border border-gray-100",
};

/**
 * PageCard Component
 * 
 * Consistent card styling across the application.
 * Easy to update card appearance by modifying variantStyles.
 */
export function PageCard({
  title,
  children,
  className,
  headerClassName,
  contentClassName,
  variant = "default",
}: PageCardProps) {
  return (
    <Card
      className={cn(
        variantStyles[variant],
        className
      )}
    >
      {title && (
        <CardHeader className={cn(headerClassName)}>
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(contentClassName)}>{children}</CardContent>
    </Card>
  );
}

