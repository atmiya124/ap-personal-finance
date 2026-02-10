"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Tag,
  TrendingUp,
  Calendar,
  Settings,
  FileText,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Monthly Overview", href: "/overview", icon: BarChart3 },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Category", href: "/categories", icon: Tag },
  { name: "Accounts", href: "/accounts", icon: Wallet },
  { name: "Subscriptions", href: "/subscriptions", icon: Calendar },
  { name: "Investments", href: "/investments", icon: TrendingUp },
  { name: "Income Tax", href: "/tax", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-8 text-gray-900">AP - Finance</h1>
      <nav className="space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-gray-500")} />
              <span className={cn("font-medium", isActive && "font-semibold")}>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

