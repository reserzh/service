"use client";

export async function exportTableToExcel(
  title: string,
  columns: string[],
  rows: string[][]
) {
  const XLSX = await import("xlsx");

  // Sanitize cells to prevent formula injection (=, +, -, @, \t, \r)
  const sanitize = (val: string) =>
    /^[=+\-@\t\r]/.test(val) ? `'${val}` : val;
  const safeRows = rows.map((row) => row.map(sanitize));
  const data = [columns, ...safeRows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));

  // Auto-size columns
  const maxWidths = columns.map((col, i) => {
    const dataLengths = rows.map((row) => (row[i] || "").length);
    return Math.max(col.length, ...dataLengths);
  });
  ws["!cols"] = maxWidths.map((w) => ({ wch: Math.min(w + 2, 40) }));

  XLSX.writeFile(wb, `${title.replace(/\s+/g, "-").toLowerCase()}.xlsx`);
}
