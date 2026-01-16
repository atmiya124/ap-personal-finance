"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportToCSV, exportToJSON, formatDate } from "@/lib/export-utils";

interface ExportButtonProps {
  data: any[];
  filename: string;
  dataType: string;
  headers?: string[];
  transformData?: (data: any[]) => any[];
}

export function ExportButton({ 
  data, 
  filename, 
  dataType,
  headers,
  transformData 
}: ExportButtonProps) {
  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      alert(`No ${dataType} data to export`);
      return;
    }

    let exportData = transformData ? transformData(data) : data;
    exportToCSV(exportData, `${filename}-${new Date().toISOString().split("T")[0]}.csv`, headers);
  };

  const handleExportJSON = () => {
    if (!data || data.length === 0) {
      alert(`No ${dataType} data to export`);
      return;
    }

    let exportData = transformData ? transformData(data) : data;
    exportToJSON(exportData, `${filename}-${new Date().toISOString().split("T")[0]}.json`);
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON}>
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
