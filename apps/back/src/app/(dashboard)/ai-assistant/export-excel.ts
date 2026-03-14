"use client";

export async function exportTableToExcel(
  title: string,
  columns: string[],
  rows: string[][]
) {
  const ExcelJS = await import("exceljs");

  // Sanitize cells to prevent formula injection (=, +, -, @, \t, \r)
  const sanitize = (val: string) =>
    /^[=+\-@\t\r]/.test(val) ? `'${val}` : val;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(title.slice(0, 31));

  // Add header row
  sheet.addRow(columns);

  // Add data rows
  for (const row of rows) {
    sheet.addRow(row.map(sanitize));
  }

  // Auto-size columns
  sheet.columns.forEach((col, i) => {
    const dataLengths = rows.map((row) => (row[i] || "").length);
    const maxWidth = Math.max(columns[i]?.length ?? 0, ...dataLengths);
    col.width = Math.min(maxWidth + 2, 40);
  });

  // Write to buffer and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/\s+/g, "-").toLowerCase()}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
