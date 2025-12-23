"use client";

import { cn } from "@/lib/utils";
import { UI_CONSTANTS } from "@/lib/ui-constants";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader Component
 * 
 * Consistent page header with title, description, and optional action button.
 * Easy to update styling by modifying this component.
 */
export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between mb-8",
        className
      )}
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

