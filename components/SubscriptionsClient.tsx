"use client";

import { useRouter } from "next/navigation";
import { SubscriptionList } from "@/components/SubscriptionList";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { ExportButton } from "@/components/ExportButton";
import { startTransition } from "react";
import { formatDate } from "@/lib/export-utils";

interface SubscriptionsClientProps {
  initialData: {
    subscriptions: any[];
    categories: any[];
    accounts: any[];
  };
}

export function SubscriptionsClient({ initialData }: SubscriptionsClientProps) {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 bg-gray-50 min-h-screen">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Subscriptions & Bills</h1>
          <div className="flex items-center gap-3">
            <ExportButton
              data={initialData.subscriptions}
              filename="subscriptions"
              dataType="subscriptions"
              headers={["Name", "Type", "Amount", "Frequency", "Due Date", "Category", "Account", "Is Active", "Created At"]}
              transformData={(subscriptions) => {
                return subscriptions.map((s: any) => ({
                  Name: s.name,
                  Type: s.type,
                  Amount: s.amount,
                  Frequency: s.frequency,
                  "Due Date": s.dueDate || "",
                  Category: s.category?.name || "",
                  Account: s.account?.name || "",
                  "Is Active": s.isActive ? "Yes" : "No",
                  "Created At": formatDate(s.createdAt),
                }));
              }}
            />
            <SubscriptionForm 
              categories={initialData.categories}
              accounts={initialData.accounts}
              onSuccess={() => {
                startTransition(() => {
                  router.refresh();
                });
              }}
            />
          </div>
        </div>
        <SubscriptionList 
          subscriptions={initialData.subscriptions} 
          categories={initialData.categories}
          accounts={initialData.accounts}
        />
      </div>
    </div>
  );
}

