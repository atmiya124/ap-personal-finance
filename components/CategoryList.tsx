"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { Edit, Trash2 } from "lucide-react";
import { CategoryForm } from "./CategoryForm";
import { deleteCategory } from "@/app/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string;
}

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories: initialCategories }: CategoryListProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDeleteClick = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    
    try {
      await deleteCategory(categoryToDelete);
      setCategories(categories.filter((c) => c.id !== categoryToDelete));
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  return (
    <>
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Income Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incomeCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isEditing={editingId === category.id}
                onEdit={() => setEditingId(category.id)}
                onDelete={() => handleDeleteClick(category.id)}
                onCancel={() => setEditingId(null)}
                onSuccess={() => {
                  setEditingId(null);
                  startTransition(() => {
                    router.refresh();
                  });
                }}
              />
            ))}
            {incomeCategories.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="pt-6">
                  <p className="text-gray-500 text-center py-4">No income categories</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Expense Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expenseCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isEditing={editingId === category.id}
                onEdit={() => setEditingId(category.id)}
                onDelete={() => handleDeleteClick(category.id)}
                onCancel={() => setEditingId(null)}
                onSuccess={() => {
                  setEditingId(null);
                  startTransition(() => {
                    router.refresh();
                  });
                }}
              />
            ))}
            {expenseCategories.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="pt-6">
                  <p className="text-gray-500 text-center py-4">No expense categories</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        description="Are you sure you want to delete this category? All associated transactions will be uncategorized. This action cannot be undone."
      />
    </>
  );
}

function CategoryCard({
  category,
  isEditing,
  onEdit,
  onDelete,
  onCancel,
  onSuccess,
}: {
  category: Category;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  if (isEditing) {
    return (
      <div className="col-span-full">
        <CategoryForm category={category} onCancel={onCancel} onSuccess={onSuccess} />
      </div>
    );
  }

  return (
    <Card style={{ borderLeftColor: category.color, borderLeftWidth: "4px" }}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {category.icon && <span className="text-2xl">{category.icon}</span>}
            <div>
              <h3 className="text-lg font-semibold">{category.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{category.type}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
