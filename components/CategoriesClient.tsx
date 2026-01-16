"use client";

import { useRouter } from "next/navigation";
import { CategoryList } from "@/components/CategoryList";
import { CategoryForm } from "@/components/CategoryForm";
import { ExportButton } from "@/components/ExportButton";
import { startTransition } from "react";
import { formatDate } from "@/lib/export-utils";

interface CategoriesClientProps {
  initialData: {
    categories: any[];
  };
}

export function CategoriesClient({ initialData }: CategoriesClientProps) {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 bg-gray-50 min-h-screen">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <div className="flex items-center gap-3">
            <ExportButton
              data={initialData.categories}
              filename="categories"
              dataType="categories"
              headers={["Name", "Type", "Icon", "Color", "Created At"]}
              transformData={(categories) => {
                return categories.map((c: any) => ({
                  Name: c.name,
                  Type: c.type,
                  Icon: c.icon || "",
                  Color: c.color || "",
                  "Created At": formatDate(c.createdAt),
                }));
              }}
            />
            <CategoryForm 
              onSuccess={() => {
                startTransition(() => {
                  router.refresh();
                });
              }}
            />
          </div>
        </div>
        <CategoryList categories={initialData.categories} />
      </div>
    </div>
  );
}

