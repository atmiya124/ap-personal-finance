"use client";

import { useRouter } from "next/navigation";
import { AccountList } from "@/components/AccountList";
import { AccountForm } from "@/components/AccountForm";
import { startTransition } from "react";

interface AccountsClientProps {
  initialData: {
    accounts: any[];
  };
}

export function AccountsClient({ initialData }: AccountsClientProps) {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 bg-gray-50 min-h-screen">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
          <AccountForm 
            onSuccess={() => {
              startTransition(() => {
                router.refresh();
              });
            }}
          />
        </div>
        <AccountList accounts={initialData.accounts} />
      </div>
    </div>
  );
}

