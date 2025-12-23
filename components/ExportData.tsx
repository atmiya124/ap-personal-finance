"use client";

import { Download } from "lucide-react";
import { exportData } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ExportData() {
  const handleExport = async (format: "csv" | "json") => {
    const result = await exportData(format);
    if (!result) return;

    const { user, format: exportFormat } = result;

    if (exportFormat === "json") {
      const dataStr = JSON.stringify(user, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `finance-export-${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV export
      const csvRows: string[] = [];
      
      // Transactions CSV
      csvRows.push("Transactions");
      csvRows.push("Date,Type,Amount,Description,Payee,Account,Category");
      user.transactions.forEach((t: any) => {
        const date = typeof t.date === "string" ? t.date : t.date.toISOString().split("T")[0];
        csvRows.push(
          `${date},${t.type},${t.amount},"${t.description || ""}","${t.payee || ""}",${t.account.name},"${t.category?.name || ""}"`
        );
      });
      
      csvRows.push("");
      csvRows.push("Accounts");
      csvRows.push("Name,Type,Balance,Currency");
      user.accounts.forEach((a: any) => {
        csvRows.push(`${a.name},${a.type},${a.balance},${a.currency}`);
      });

      const csvContent = csvRows.join("\n");
      const dataBlob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `finance-export-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Data</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Export your financial data for backup or analysis.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => handleExport("csv")} variant="default" className="bg-green-600 hover:bg-green-700">
            <Download className="w-5 h-5 mr-2" />
            Export as CSV
          </Button>
          <Button onClick={() => handleExport("json")}>
            <Download className="w-5 h-5 mr-2" />
            Export as JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
