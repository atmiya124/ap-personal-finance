/**
 * Utility functions for exporting data to CSV and JSON formats
 */

export function exportToCSV(data: any[], filename: string, headers?: string[]) {
  if (!data || data.length === 0) {
    return;
  }

  const csvRows: string[] = [];
  
  // Add headers if provided, otherwise use object keys
  if (headers && headers.length > 0) {
    csvRows.push(headers.join(","));
  } else if (data.length > 0) {
    const firstRow = data[0];
    const keys = Object.keys(firstRow);
    csvRows.push(keys.join(","));
  }

  // Add data rows
  data.forEach((row) => {
    const values = Object.values(row).map((value) => {
      if (value === null || value === undefined) {
        return "";
      }
      // Handle dates
      if (value instanceof Date) {
        return value.toISOString().split("T")[0];
      }
      // Handle objects (stringify them)
      if (typeof value === "object") {
        return JSON.stringify(value);
      }
      // Escape quotes and wrap in quotes if contains comma
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(","));
  });

  const csvContent = csvRows.join("\n");
  downloadFile(csvContent, filename, "text/csv");
}

export function exportToJSON(data: any, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2);
  downloadFile(jsonStr, filename, "application/json");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatDate(date: Date | string): string {
  if (typeof date === "string") {
    return date.split("T")[0];
  }
  return date.toISOString().split("T")[0];
}
