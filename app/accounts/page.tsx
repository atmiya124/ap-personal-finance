import { prisma } from "@/lib/prisma";
import { AccountsClient } from "@/components/AccountsClient";
import { getCurrentUser } from "@/lib/get-user-id";

async function getAccounts() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { accounts };
}

export default async function AccountsPage() {
  const { accounts } = await getAccounts();

  return <AccountsClient initialData={{ accounts }} />;
}

