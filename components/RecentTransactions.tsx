"use client";

import { useState, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowUpDown, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TransactionForm } from "@/components/TransactionForm";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  payee: string | null;
  date: Date | string;
  category: {
    name: string;
    color?: string;
  } | null;
  account: {
    id: string;
    name: string;
  };
}

interface Account {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  accounts?: Account[];
  categories?: Category[];
  isCurrentYear?: boolean;
}

export function RecentTransactions({ 
  transactions: initialTransactions,
  accounts = [],
  categories = [],
  isCurrentYear = true,
}: RecentTransactionsProps) {
  const router = useRouter();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [filterPayee, setFilterPayee] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const rowsPerPage = 10;

  // Update transactions when initialTransactions changes
  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  // Get unique category names from transactions
  const categoryNames = Array.from(
    new Set(transactions.map((t) => t.category?.name).filter(Boolean))
  ) as string[];

  // Filter transactions
  let filteredTransactions = transactions.filter((t) => {
    if (filterPayee && !t.payee?.toLowerCase().includes(filterPayee.toLowerCase())) {
      return false;
    }
    if (selectedCategory !== "All Categories" && t.category?.name !== selectedCategory) {
      return false;
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{isCurrentYear ? "Recent Transactions" : "Last Transactions"}</CardTitle>
          <div className="flex items-center gap-2">
            <Select defaultValue="This Year">
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="This Year">This Year</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="This Week">This Week</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              Filter
            </Button>
            {accounts.length > 0 && categories.length > 0 && (
              <TransactionForm 
                accounts={accounts} 
                categories={categories}
                buttonText="+ Add"
                onSuccess={() => {
                  startTransition(() => {
                    router.refresh();
                  });
                }}
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((transaction) => {
                  const date = typeof transaction.date === "string" 
                    ? new Date(transaction.date) 
                    : transaction.date;
                  const transactionName = transaction.payee || transaction.description || "Unnamed Transaction";
                  
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {transactionName}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {format(date, "yyyy-MM-dd")}
                      </TableCell>
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
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {transaction.account?.name || "-"}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-gray-900"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-gray-500">
              {selectedRows.length} of {paginatedTransactions.length} row(s) selected.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
