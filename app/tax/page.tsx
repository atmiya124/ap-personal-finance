import { BusinessIncomeCalculator } from "@/components/BusinessIncomeCalculator";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user-id";

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

async function getTransactions() {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: "income",
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
  const accounts = await getAccounts();
  const transactions = await getTransactions();

  return (
    <div className="bg-gray-50 min-h-screen">
      <BusinessIncomeCalculator accounts={accounts} transactions={transactions} />
    </div>
  );
}

