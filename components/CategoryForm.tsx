"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { createCategory, updateCategory } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string;
}

interface CategoryFormProps {
  category?: Category;
  onCancel?: () => void;
  onSuccess?: () => void;
}

const commonIcons = ["💰", "🍔", "🚗", "🏠", "💡", "📱", "🎮", "✈️", "👕", "💊", "🎓", "🎬"];

export function CategoryForm({ category, onCancel, onSuccess }: CategoryFormProps) {
  const [isOpen, setIsOpen] = useState(!!category);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [name, setName] = useState(category?.name || "");
  const [type, setType] = useState(category?.type || "expense");
  const [icon, setIcon] = useState(category?.icon || "");
  const [color, setColor] = useState(category?.color || "#3B82F6");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        name,
        type,
        icon: icon || null,
        color,
      };

      if (category) {
        await updateCategory(category.id, data);
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        await createCategory(data);
        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }

      setIsOpen(false);
      if (onSuccess) onSuccess();
      if (!category) {
        setName("");
        setType("expense");
        setIcon("");
        setColor("#3B82F6");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: category ? "Failed to update category" : "Failed to create category",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !category) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            Add Category
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Icon (Emoji)</Label>
              <div className="flex gap-2 flex-wrap">
                {commonIcons.map((ic) => (
                  <Button
                    key={ic}
                    type="button"
                    variant={icon === ic ? "default" : "outline"}
                    size="icon"
                    onClick={() => setIcon(ic)}
                    className="text-2xl"
                  >
                    {ic}
                  </Button>
                ))}
              </div>
              <Input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="Or enter custom emoji"
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{category ? "Edit" : "Add"} Category</CardTitle>
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Icon (Emoji)</Label>
            <div className="flex gap-2 flex-wrap">
              {commonIcons.map((ic) => (
                <Button
                  key={ic}
                  type="button"
                  variant={icon === ic ? "default" : "outline"}
                  size="icon"
                  onClick={() => setIcon(ic)}
                  className="text-2xl"
                >
                  {ic}
                </Button>
              ))}
            </div>
            <Input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Or enter custom emoji"
              maxLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-10"
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3B82F6"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {category ? "Update" : "Create"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
