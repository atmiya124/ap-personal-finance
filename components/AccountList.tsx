"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { formatCurrency } from "@/lib/utils";
import { Edit, Trash2, Wallet, CreditCard, PiggyBank } from "lucide-react";
import { AccountForm } from "./AccountForm";
import { deleteAccount } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

interface AccountListProps {
  accounts: Account[];
}

const accountIcons: Record<string, any> = {
  bank: Wallet,
  credit_card: CreditCard,
  wallet: Wallet,
  savings: PiggyBank,
};

export function AccountList({ accounts: initialAccounts }: AccountListProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(initialAccounts);

  useEffect(() => {
    setAccounts(initialAccounts);
  }, [initialAccounts]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDeleteClick = (id: string) => {
    setAccountToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;
    
    try {
      await deleteAccount(accountToDelete);
      setAccounts(accounts.filter((a) => a.id !== accountToDelete));
      toast({
        title: "Success",
        description: "Account deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <>
      <div className="space-y-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-1">Total Balance</p>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(totalBalance)}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const Icon = accountIcons[account.type] || Wallet;
            return editingId === account.id ? (
              <div key={account.id} className="col-span-full">
                <AccountForm
                  account={account}
                  onCancel={() => setEditingId(null)}
                  onSuccess={() => {
                    setEditingId(null);
                    startTransition(() => {
                      router.refresh();
                    });
                  }}
                />
              </div>
            ) : (
              <Card key={account.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-8 h-8 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg">{account.name}</CardTitle>
                        <p className="text-sm text-gray-500 capitalize">{account.type.replace("_", " ")}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingId(account.id)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(account.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-1">Balance</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {accounts.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-500 text-center py-12">No accounts yet. Create your first account to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Account"
        description="Are you sure you want to delete this account? All associated transactions will also be deleted. This action cannot be undone."
      />
    </>
  );
}
