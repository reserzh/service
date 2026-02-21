/**
 * Convert an array of objects to a CSV string.
 * Handles quoting and escaping per RFC 4180.
 */
export function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; header: string }[]
): string {
  const escape = (val: unknown): string => {
    if (val == null) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map((c) => escape(c.header)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escape(row[c.key])).join(","))
    .join("\n");

  return `${header}\n${body}`;
}

const EXPORT_PAGE_SIZE = 100;
const MAX_EXPORT_ROWS = 5000;

/**
 * Fetch all pages from a paginated list function.
 * Caps at MAX_EXPORT_ROWS to prevent abuse.
 */
export async function fetchAllPages<T>(
  fetcher: (page: number, pageSize: number) => Promise<{ data: T[]; meta: { total: number } }>
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;

  while (true) {
    const result = await fetcher(page, EXPORT_PAGE_SIZE);
    all.push(...result.data);
    if (all.length >= result.meta.total || all.length >= MAX_EXPORT_ROWS || result.data.length < EXPORT_PAGE_SIZE) {
      break;
    }
    page++;
  }

  return all.slice(0, MAX_EXPORT_ROWS);
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
