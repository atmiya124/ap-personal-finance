import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { DashboardSummary } from "@/components/DashboardSummary";
import { IncomeExpenseChart } from "@/components/IncomeExpenseChart";
import { CategorySpendingChart } from "@/components/CategorySpendingChart";
import { RecentTransactions } from "@/components/RecentTransactions";
import { WelcomeSection } from "@/components/WelcomeSection";
import { DashboardClient } from "@/components/DashboardClient";
import { getCurrentUser } from "@/lib/get-user-id";

// Mark page as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

async function getDashboardData(dateRange?: { from?: Date; to?: Date }) {
  // Get current authenticated user
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Build date filter
  const dateFilter: any = {};
  if (dateRange?.from) {
    dateFilter.gte = dateRange.from;
  }
  if (dateRange?.to) {
    const endDate = new Date(dateRange.to);
    endDate.setHours(23, 59, 59, 999);
    dateFilter.lte = endDate;
  }

  // Get transactions with optional date filter
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
    },
    include: {
      account: true,
      category: true,
    },
    orderBy: { date: "desc" },
  });

  // Get accounts
  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
  });

  // Get categories
  const categories = await prisma.category.findMany({
    where: { userId: user.id },
  });

  // Get subscriptions
  const subscriptions = await prisma.subscription.findMany({
    where: { userId: user.id, isActive: true },
    include: {
      category: true,
      payments: {
        orderBy: { paidDate: "desc" },
        take: 12, // Get last 12 payments to check current month status
      },
    },
  });

  // Calculate totals
  const totalIncome = transactions
    .filter((t: any) => t.type === "income")
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t: any) => t.type === "expense")
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const totalBalance = accounts.reduce((sum: number, a: any) => sum + a.balance, 0);
  const remainingBalance = totalBalance;

  return {
    user,
    totalIncome,
    totalExpenses,
    remainingBalance,
    transactions,
    subscriptions,
    accounts,
    categories,
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { from?: string; to?: string; year?: string };
}) {
  let dateRange: { from?: Date; to?: Date } | undefined;
  
  // If year is provided, set date range to that year (Jan 1 to Dec 31)
  if (searchParams?.year) {
    const year = parseInt(searchParams.year);
    dateRange = {
      from: new Date(year, 0, 1), // January 1
      to: new Date(year, 11, 31, 23, 59, 59, 999), // December 31
    };
  } else if (searchParams?.from && searchParams?.to) {
    dateRange = {
      from: new Date(searchParams.from),
      to: new Date(searchParams.to),
    };
  } else {
    // Default to current year
    const currentYear = new Date().getFullYear();
    dateRange = {
      from: new Date(currentYear, 0, 1),
      to: new Date(currentYear, 11, 31, 23, 59, 59, 999),
    };
  }

  // Get current authenticated user
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get all transactions to determine available years
  const allTransactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    select: { date: true },
    orderBy: { date: "asc" },
  });

  // Extract unique years from transactions
  const years = new Set<number>();
  allTransactions.forEach((t) => {
    const year = new Date(t.date).getFullYear();
    years.add(year);
  });
  
  // Add current year if no transactions exist
  if (years.size === 0) {
    years.add(new Date().getFullYear());
  }

  const availableYears = Array.from(years).sort((a, b) => b - a); // Most recent first

  const data = await getDashboardData(dateRange);

  return <DashboardClient initialData={data} availableYears={availableYears} />;
}
