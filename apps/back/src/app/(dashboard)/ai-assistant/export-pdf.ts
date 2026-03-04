"use client";

export async function exportTableToPdf(
  title: string,
  columns: string[],
  rows: string[][]
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF();

  // Title
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  // Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

  // Table
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 34,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  doc.save(`${title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
