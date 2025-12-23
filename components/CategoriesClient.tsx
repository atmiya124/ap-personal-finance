"use client";

import { useRouter } from "next/navigation";
import { CategoryList } from "@/components/CategoryList";
import { CategoryForm } from "@/components/CategoryForm";
import { startTransition } from "react";

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
          <CategoryForm 
            onSuccess={() => {
              startTransition(() => {
                router.refresh();
              });
            }}
          />
        </div>
        <CategoryList categories={initialData.categories} />
      </div>
    </div>
  );
}

