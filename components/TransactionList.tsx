"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/datepicker";
import { Edit, Trash2, Filter } from "lucide-react";
import { TransactionForm } from "./TransactionForm";
import { deleteTransaction } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Account {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
  color?: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  payee: string | null;
  date: Date | string;
  account: Account;
  category: Category | null;
}

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}

export function TransactionList({ transactions: initialTransactions, accounts, categories }: TransactionListProps) {
  const [transactions, setTransactions] = useState(initialTransactions);

  // Update transactions when initialTransactions changes
  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (filterCategory !== "all" && t.category?.id !== filterCategory) return false;
    if (filterAccount !== "all" && t.account.id !== filterAccount) return false;
    if (selectedMonth) {
      const date = typeof t.date === "string" ? new Date(t.date) : t.date;
      if (
        date.getFullYear() !== selectedMonth.getFullYear() ||
        date.getMonth() !== selectedMonth.getMonth()
      ) {
        return false;
      }
    }
    return true;
  });

  // Calculate totals for selected month
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return;
    
    try {
      await deleteTransaction(transactionToDelete);
      setTransactions(transactions.filter((t) => t.id !== transactionToDelete));
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            {/* Month Picker */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Month:</span>
              <DatePicker
                date={selectedMonth || undefined}
                onDateChange={(date) => setSelectedMonth(date || null)}
                placeholder="Select month"
                className="w-[180px]"
                mode="month"
              />
            </div>
            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Account Filter */}
            <Select value={filterAccount} onValueChange={setFilterAccount}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Totals for selected month */}
          {selectedMonth && (
            <div className="mb-4 flex gap-8 items-center">
              <div className="">
                Total Income: <span className="text-green-700 font-semibold text-lg">{formatCurrency(totalIncome)}</span>
              </div>
              <div className="">
                Total Expense: <span className="text-red-700 font-semibold text-lg">{formatCurrency(totalExpense)}</span>
              </div>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Payee</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => {
                  const date = typeof transaction.date === "string" 
                    ? new Date(transaction.date) 
                    : transaction.date;
                  return editingId === transaction.id ? (
                    <TableRow key={transaction.id}>
                      <TableCell colSpan={7}>
                        <TransactionForm
                          accounts={accounts}
                          categories={categories}
                          transaction={transaction}
                          open={editingId === transaction.id}
                          onOpenChange={(open) => {
                            if (!open) setEditingId(null);
                          }}
                          onCancel={() => setEditingId(null)}
                          onSuccess={() => {
                            setEditingId(null);
                            // Refresh will be handled by parent
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow key={transaction.id}>
                      <TableCell>{format(date, "MMM dd, yyyy")}</TableCell>
                      <TableCell>{transaction.payee || "-"}</TableCell>
                      <TableCell>{transaction.description || "-"}</TableCell>
                      <TableCell>
                        {transaction.category ? (
                          <Badge
                            variant="outline"
                            className="text-xs font-medium"
                            style={{
                              borderColor: transaction.category.color || "#3B82F6",
                              color: transaction.category.color || "#3B82F6",
                              backgroundColor: `${transaction.category.color || "#3B82F6"}15`,
                            }}
                          >
                            {transaction.category.name}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{transaction.account.name}</TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingId(transaction.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(transaction.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
      />
    </>
  );
}
