import { prisma } from "@/lib/prisma";
import { TransactionsClient } from "@/components/TransactionsClient";
import { getCurrentUser } from "@/lib/get-user-id";

// Mark page as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

async function getTransactions() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    include: {
      account: true,
      category: true,
    },
    orderBy: { date: "desc" },
  });

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
  });

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
  });

  return { transactions, accounts, categories };
}

export default async function TransactionsPage() {
  const { transactions, accounts, categories } = await getTransactions();

  return <TransactionsClient initialData={{ transactions, accounts, categories }} />;
}

