import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user-id";
import { OverviewClient } from "@/components/OverviewClient";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

async function getOverviewData(month: number, year: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      date: { gte: startDate, lte: endDate },
    },
    include: {
      account: true,
      category: true,
    },
    orderBy: { date: "asc" },
  });

  const allForYears = await prisma.transaction.findMany({
    where: { userId: user.id },
    select: { date: true },
  });
  const years = new Set<number>();
  allForYears.forEach((t) => years.add(new Date(t.date).getFullYear()));
  if (years.size === 0) years.add(new Date().getFullYear());
  const availableYears = Array.from(years).sort((a, b) => b - a);

  return {
    transactions,
    month,
    year,
    monthName: MONTH_NAMES[month - 1],
    availableYears,
  };
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams?: { month?: string; year?: string };
}) {
  const now = new Date();
  const month = searchParams?.month ? parseInt(searchParams.month, 10) : now.getMonth() + 1;
  const year = searchParams?.year ? parseInt(searchParams.year, 10) : now.getFullYear();

  const data = await getOverviewData(
    Math.min(12, Math.max(1, month)),
    year
  );

  return (
    <OverviewClient
      initialData={data}
      availableYears={data.availableYears}
    />
  );
}
