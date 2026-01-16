"use client";

import { useRouter } from "next/navigation";
import { AccountList } from "@/components/AccountList";
import { AccountForm } from "@/components/AccountForm";
import { ExportButton } from "@/components/ExportButton";
import { startTransition } from "react";
import { formatDate } from "@/lib/export-utils";

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
          <div className="flex items-center gap-3">
            <ExportButton
              data={initialData.accounts}
              filename="accounts"
              dataType="accounts"
              headers={["Name", "Type", "Balance", "Currency", "Created At"]}
              transformData={(accounts) => {
                return accounts.map((a: any) => ({
                  Name: a.name,
                  Type: a.type,
                  Balance: a.balance,
                  Currency: a.currency,
                  "Created At": formatDate(a.createdAt),
                }));
              }}
            />
            <AccountForm 
              onSuccess={() => {
                startTransition(() => {
                  router.refresh();
                });
              }}
            />
          </div>
        </div>
        <AccountList accounts={initialData.accounts} />
      </div>
    </div>
  );
}

