import { db } from "@/lib/db";
import { pricebookItems } from "@fieldservice/shared/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { escapeLike } from "@/lib/utils";

interface CalculatedOptionItem {
  pricebookItemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  type: string;
}

interface CalculatedOption {
  name: string;
  description: string;
  isRecommended: boolean;
  items: CalculatedOptionItem[];
  total: number;
}

export async function calculateAreaEstimate(
  ctx: UserContext,
  input: {
    areaSqft: number;
    serviceCategories: string[];
  }
): Promise<{ options: CalculatedOption[] }> {
  assertPermission(ctx, "estimates", "create");

  // Query pricebook items that match the requested categories and have sqft-based units
  const allItems: Array<{
    id: string;
    name: string;
    category: string | null;
    type: string;
    unitPrice: string;
    unit: string | null;
    description: string | null;
  }>[] = [];

  for (const category of input.serviceCategories) {
    const items = await db
      .select({
        id: pricebookItems.id,
        name: pricebookItems.name,
        category: pricebookItems.category,
        type: pricebookItems.type,
        unitPrice: pricebookItems.unitPrice,
        unit: pricebookItems.unit,
        description: pricebookItems.description,
      })
      .from(pricebookItems)
      .where(
        and(
          eq(pricebookItems.tenantId, ctx.tenantId),
          eq(pricebookItems.isActive, true),
          ilike(pricebookItems.category, `%${escapeLike(category)}%`)
        )
      );

    allItems.push(items);
  }

  // Separate sqft-based items from add-on items
  const sqftItems: Array<{
    id: string;
    name: string;
    category: string | null;
    type: string;
    unitPrice: number;
    unit: string | null;
    description: string | null;
  }> = [];
  const addOnItems: typeof sqftItems = [];

  for (const categoryItems of allItems) {
    for (const item of categoryItems) {
      const parsed = {
        ...item,
        unitPrice: Number(item.unitPrice),
      };
      const unit = (item.unit ?? "").toLowerCase();
      if (unit === "sqft" || unit === "sq ft" || unit === "per sqft" || unit === "square foot") {
        sqftItems.push(parsed);
      } else {
        addOnItems.push(parsed);
      }
    }
  }

  // Sort sqft items by price ascending
  sqftItems.sort((a, b) => a.unitPrice - b.unitPrice);

  // Group sqft items by category
  const byCategory = new Map<string, typeof sqftItems>();
  for (const item of sqftItems) {
    const cat = item.category ?? "Uncategorized";
    const list = byCategory.get(cat) ?? [];
    list.push(item);
    byCategory.set(cat, list);
  }

  function buildOption(
    name: string,
    description: string,
    isRecommended: boolean,
    itemPicker: (items: typeof sqftItems) => typeof sqftItems[number] | undefined,
    includeAddOns: boolean
  ): CalculatedOption {
    const optionItems: CalculatedOptionItem[] = [];

    for (const [, items] of byCategory) {
      const picked = itemPicker(items);
      if (picked) {
        optionItems.push({
          pricebookItemId: picked.id,
          description: picked.name,
          quantity: input.areaSqft,
          unitPrice: picked.unitPrice,
          type: picked.type,
        });
      }
    }

    if (includeAddOns) {
      for (const addon of addOnItems) {
        optionItems.push({
          pricebookItemId: addon.id,
          description: addon.name,
          quantity: 1,
          unitPrice: addon.unitPrice,
          type: addon.type,
        });
      }
    }

    const total = optionItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    return { name, description, isRecommended, items: optionItems, total };
  }

  // Good: cheapest per category
  const good = buildOption(
    "Good",
    "Essential services at the best value",
    false,
    (items) => items[0],
    false
  );

  // Better: mid-range per category
  const better = buildOption(
    "Better",
    "Enhanced service with premium options",
    true,
    (items) => items[Math.floor(items.length / 2)] ?? items[0],
    false
  );

  // Best: most expensive per category + add-ons
  const best = buildOption(
    "Best",
    "Complete premium service package",
    false,
    (items) => items[items.length - 1],
    true
  );

  return { options: [good, better, best].filter((o) => o.items.length > 0) };
}
