import { prisma } from "@/lib/prisma";
import { CategoriesClient } from "@/components/CategoriesClient";
import { getCurrentUser } from "@/lib/get-user-id";

async function getCategories() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { categories };
}

export default async function CategoriesPage() {
  const { categories } = await getCategories();

  return <CategoriesClient initialData={{ categories }} />;
}

