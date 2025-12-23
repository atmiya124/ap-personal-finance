import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "CAD"): string {
  // For INR, show with ₹ symbol
  if (currency === "INR") {
    return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  }
  
  // For CAD (default), don't show currency code, just show the amount with $ symbol
  if (currency === "CAD") {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      currencyDisplay: "narrowSymbol", // Shows just $ instead of CA$
    }).format(amount);
  }
  
  // For USD, show with $ symbol
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      currencyDisplay: "narrowSymbol",
    }).format(amount);
  }
  
  // Fallback for other currencies
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function formatDate(date: Date | string, format: string = "MM/DD/YYYY"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (format === "MM/DD/YYYY") {
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
  }
  return d.toLocaleDateString();
}

