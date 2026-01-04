import { BusinessIncomeCalculator } from "@/components/BusinessIncomeCalculator";
import { YearSelector } from "@/components/YearSelector";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user-id";

// Mark page as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

async function getAccounts() {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  try {
    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return accounts;
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return [];
  }
}

async function getTransactions(year: number) {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: "income",
        date: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      include: {
        category: true,
        account: true,
      },
      orderBy: { date: "desc" },
    });
    return transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}


export default async function TaxPage() {
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const accounts = await getAccounts();
  const transactions = await getTransactions(currentYear);

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <YearSelector availableYears={availableYears} currentYear={currentYear} />
      </div>
      <BusinessIncomeCalculator accounts={accounts} transactions={transactions} />
    </div>
  );
}

