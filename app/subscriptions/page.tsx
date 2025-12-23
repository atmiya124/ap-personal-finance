import { prisma } from "@/lib/prisma";
import { SubscriptionsClient } from "@/components/SubscriptionsClient";
import { getCurrentUser } from "@/lib/get-user-id";

// Mark page as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

async function getSubscriptions() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: user.id },
    include: {
      category: true,
      account: true,
      payments: {
        orderBy: { paidDate: "desc" },
        take: 12,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
  });

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { subscriptions, categories, accounts };
}

export default async function SubscriptionsPage() {
  const { subscriptions, categories, accounts } = await getSubscriptions();

  return <SubscriptionsClient initialData={{ subscriptions, categories, accounts }} />;
}

