"use client";

import { cn } from "@/lib/utils";

interface TypographyProps {
  children: React.ReactNode;
  variant?: "h1" | "h2" | "h3" | "h4" | "body" | "small" | "caption";
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  color?: "primary" | "secondary" | "muted" | "error" | "success";
}

const variantStyles = {
  h1: "text-4xl font-bold tracking-tight",
  h2: "text-3xl font-semibold tracking-tight",
  h3: "text-2xl font-semibold",
  h4: "text-xl font-medium",
  body: "text-base",
  small: "text-sm",
  caption: "text-xs text-gray-500",
};

const colorStyles = {
  primary: "text-gray-900",
  secondary: "text-gray-700",
  muted: "text-gray-500",
  error: "text-red-600",
  success: "text-green-600",
};

const defaultElements = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  body: "p",
  small: "p",
  caption: "span",
} as const;

/**
 * Typography Component
 * 
 * Consistent typography styling across the application.
 * Easy to update text styles by modifying variantStyles.
 */
export function Typography({
  children,
  variant = "body",
  className,
  as,
  color = "primary",
}: TypographyProps) {
  const Component = as || defaultElements[variant];
  
  return (
    <Component
      className={cn(
        variantStyles[variant],
        colorStyles[color],
        className
      )}
    >
      {children}
    </Component>
  );
}

