"use client";

import { useState, useEffect } from "react";
import { Plus, X, Loader2, ArrowDownCircle, ArrowUpCircle, DollarSign, Calendar as CalendarIcon, Wallet, Tag, FileText, User } from "lucide-react";
import { createTransaction, updateTransaction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { DatePicker } from "@/components/DatePicker";

interface Account {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
  icon?: string | null;
  color?: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  payee: string | null;
  date: Date | string;
  accountId?: string;
  categoryId?: string | null;
  account?: { id: string; name: string };
  category?: { id: string; name: string } | null;
}

interface TransactionFormProps {
  accounts: Account[];
  categories: Category[];
  transaction?: Transaction;
  onCancel?: () => void;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  buttonText?: string;
}

const quickAmounts = [10, 25, 50, 100, 200, 500];

export function TransactionForm({
  accounts,
  categories,
  transaction,
  onCancel,
  onSuccess,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  buttonText = "Add Transaction",
}: TransactionFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [type, setType] = useState(transaction?.type || "expense");
  const [amount, setAmount] = useState(transaction?.amount.toString() || "");
  const [description, setDescription] = useState(transaction?.description || "");
  const [payee, setPayee] = useState(transaction?.payee || "");
  const [date, setDate] = useState<Date | undefined>(
    transaction?.date
      ? typeof transaction.date === "string"
        ? new Date(transaction.date)
        : transaction.date
      : new Date()
  );
  const [accountId, setAccountId] = useState(
    transaction?.accountId || transaction?.account?.id || accounts[0]?.id || ""
  );
  const [categoryId, setCategoryId] = useState(
    transaction?.categoryId || transaction?.category?.id || "none"
  );

  // Use controlled open if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange || setInternalOpen;

  // Reset form when transaction changes or dialog opens
  useEffect(() => {
    if (transaction) {
      setType(transaction.type || "expense");
      setAmount(transaction.amount.toString() || "");
      setDescription(transaction.description || "");
      setPayee(transaction.payee || "");
      setDate(
        transaction.date
          ? typeof transaction.date === "string"
            ? new Date(transaction.date)
            : transaction.date
          : new Date()
      );
      setAccountId(transaction.accountId || transaction.account?.id || accounts[0]?.id || "");
      setCategoryId(transaction.categoryId || transaction.category?.id || "none");
    } else if (isOpen && !transaction) {
      // Reset form when opening for new transaction
      setType("expense");
      setAmount("");
      setDescription("");
      setPayee("");
      setDate(new Date());
      setAccountId(accounts[0]?.id || "");
      setCategoryId("none");
    }
  }, [transaction, isOpen, accounts]);

  const filteredCategories = categories.filter((cat) => cat.type === type || cat.type === "both");
  const selectedAccount = accounts.find((acc) => acc.id === accountId);
  const selectedCategory = filteredCategories.find((cat) => cat.id === categoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountId) {
      toast({
        title: "Error",
        description: "Please select an account",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const data = {
        type,
        amount: parseFloat(amount),
        description,
        payee,
        date: date || new Date(),
        accountId,
        categoryId: categoryId === "none" || !categoryId ? null : categoryId,
      };

      if (transaction) {
        await updateTransaction(transaction.id, data);
        toast({
          title: "Success",
          description: "Transaction updated successfully",
        });
      } else {
        await createTransaction(data);
        toast({
          title: "Success",
          description: "Transaction created successfully",
        });
      }

      setIsOpen(false);
      if (onSuccess) onSuccess();
      if (!transaction) {
        setAmount("");
        setDescription("");
        setPayee("");
        setCategoryId("none");
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Transaction error:", error);
      }
      toast({
        title: "Error",
        description: transaction
          ? "Failed to update transaction"
          : "Failed to create transaction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && onCancel) {
      onCancel();
    }
  };

  const dialogContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Transaction Type Toggle */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Transaction Type</Label>
        <button
          type="button"
          onClick={() => setType(type === "expense" ? "income" : "expense")}
          className={`w-full flex items-center justify-center gap-3 p-5 rounded-lg border-2 transition-all ${
            type === "income"
              ? "border-green-500 bg-green-50 text-green-700 hover:bg-green-100"
              : "border-red-500 bg-red-50 text-red-700 hover:bg-red-100"
          }`}
        >
          {type === "income" ? (
            <>
              <ArrowUpCircle className="w-6 h-6 text-green-600" />
              <span className="font-semibold text-lg">Income</span>
            </>
          ) : (
            <>
              <ArrowDownCircle className="w-6 h-6 text-red-600" />
              <span className="font-semibold text-lg">Expense</span>
            </>
          )}
        </button>
        <p className="text-xs text-gray-500 text-center">Click to toggle between Income and Expense</p>
      </div>

      {/* Amount Section */}
      <div className="space-y-3">
        <Label htmlFor="amount" className="text-base font-semibold flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Amount
        </Label>
        <div className="relative">
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="text-2xl font-bold h-14 pl-4 pr-4"
            required
          />
          {amount && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              {formatCurrency(parseFloat(amount) || 0)}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {quickAmounts.map((amt) => (
            <Button
              key={amt}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAmount(amt)}
              className="text-xs"
            >
              ${amt}
            </Button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category" className="flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Category
        </Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger id="category" className="h-11">
            <SelectValue placeholder="Select a category (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {filteredCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center gap-2">
                  {cat.icon && <span>{cat.icon}</span>}
                  <span>{cat.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description and Payee */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Description
          </Label>
          <Input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this for?"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payee" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Payee
          </Label>
          <Input
            id="payee"
            type="text"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            placeholder="Who or where?"
          />
        </div>
      </div>

      {/* Date and Account */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Date
          </Label>
          <DatePicker
            date={date}
            onDateChange={(selectedDate) => setDate(selectedDate)}
            placeholder="Select a date"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Account *
          </Label>
          {accounts.length === 0 ? (
            <p className="text-sm text-red-600 p-2 bg-red-50 rounded">Please create an account first</p>
          ) : (
            <Select value={accountId} onValueChange={setAccountId} required>
              <SelectTrigger id="account" className="h-11">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Summary Preview */}
      {amount && accountId && (
        <Card className={`border-2 ${type === "income" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transaction Summary</p>
                <p className="text-lg font-semibold mt-1">
                  {type === "income" ? "+" : "-"}
                  {formatCurrency(parseFloat(amount) || 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Account</p>
                <p className="text-sm font-medium mt-1">{selectedAccount?.name || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex gap-2 justify-end pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOpenChange(false)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || accounts.length === 0 || !accountId}
          className={`${
            type === "income"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
          size="lg"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {type === "income" ? (
            <>
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              {transaction ? "Update Income" : "Add Income"}
            </>
          ) : (
            <>
              <ArrowDownCircle className="w-4 h-4 mr-2" />
              {transaction ? "Update Expense" : "Add Expense"}
            </>
          )}
        </Button>
      </div>
    </form>
  );

  // If transaction is provided (editing), show as controlled dialog
  if (transaction) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Transaction</DialogTitle>
          </DialogHeader>
          {dialogContent}
        </DialogContent>
      </Dialog>
    );
  }

  // If no transaction (adding new), show with trigger button
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
          <Plus className="w-5 h-5 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add New Transaction</DialogTitle>
        </DialogHeader>
        {dialogContent}
      </DialogContent>
    </Dialog>
  );
}
