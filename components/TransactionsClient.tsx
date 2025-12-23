"use client";

import { useRouter } from "next/navigation";
import { TransactionList } from "@/components/TransactionList";
import { TransactionForm } from "@/components/TransactionForm";
import { startTransition } from "react";

interface TransactionsClientProps {
  initialData: {
    transactions: any[];
    accounts: any[];
    categories: any[];
  };
}

export function TransactionsClient({ initialData }: TransactionsClientProps) {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 bg-gray-50 min-h-screen">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <TransactionForm 
            accounts={initialData.accounts} 
            categories={initialData.categories}
            onSuccess={() => {
              startTransition(() => {
                router.refresh();
              });
            }}
          />
        </div>
        <TransactionList 
          transactions={initialData.transactions} 
          accounts={initialData.accounts} 
          categories={initialData.categories} 
        />
      </div>
    </div>
  );
}

