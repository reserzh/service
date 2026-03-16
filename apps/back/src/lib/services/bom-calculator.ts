import { db } from "@/lib/db";
import {
  estimateTemplates,
  estimateTemplateOptions,
  estimateTemplateItems,
  pricebookItems,
} from "@fieldservice/shared/db/schema";
import { eq, and, asc } from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { getAIClient, AI_MODEL, isAIConfigured } from "@/lib/ai/client";

// ---------- Types ----------

interface BOMItem {
  pricebookItemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  type: string;
  isEstimated?: boolean;
}

interface BOMOption {
  name: string;
  description: string;
  isRecommended: boolean;
  items: BOMItem[];
  total: number;
}

export interface BOMResult {
  source: "template" | "ai";
  options: BOMOption[];
}

interface BOMInput {
  jobType: string;
  areaSqft?: number;
  length?: number;
  width?: number;
  useAI?: boolean;
  description?: string;
}

// ---------- Safe Formula Evaluator ----------

/**
 * Evaluates simple arithmetic formulas with named variables.
 * Supports: +, -, *, /, parentheses, ceil(), floor(), round()
 * Uses a recursive descent parser — no eval() or new Function().
 */
function evaluateFormula(formula: string, variables: Record<string, number>): number {
  const tokens = tokenize(formula.trim().toLowerCase(), variables);
  const parser = new FormulaParser(tokens);
  const result = parser.parseExpression();
  if (parser.pos < parser.tokens.length) {
    throw new Error(`Unexpected token at position ${parser.pos}: ${parser.tokens[parser.pos].value}`);
  }
  if (!Number.isFinite(result)) {
    throw new Error(`Formula evaluated to non-finite number: ${formula}`);
  }
  return result;
}

interface Token {
  type: "number" | "op" | "lparen" | "rparen" | "func";
  value: string;
}

function tokenize(expr: string, variables: Record<string, number>): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  // Sort variable names by length (longest first) to match greedily
  const varNames = Object.keys(variables).sort((a, b) => b.length - a.length);

  while (i < expr.length) {
    // Skip whitespace
    if (/\s/.test(expr[i])) { i++; continue; }

    // Numbers (including decimals)
    if (/\d/.test(expr[i]) || (expr[i] === "." && i + 1 < expr.length && /\d/.test(expr[i + 1]))) {
      let num = "";
      while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === ".")) {
        num += expr[i++];
      }
      tokens.push({ type: "number", value: num });
      continue;
    }

    // Functions: ceil, floor, round
    const funcMatch = expr.slice(i).match(/^(ceil|floor|round)\s*\(/);
    if (funcMatch) {
      tokens.push({ type: "func", value: funcMatch[1] });
      i += funcMatch[0].length - 1; // -1 because ( will be consumed next
      continue;
    }

    // Variable names
    let matched = false;
    for (const name of varNames) {
      if (expr.slice(i, i + name.length) === name) {
        // Ensure it's a full word boundary (not a prefix of a longer identifier)
        const afterChar = expr[i + name.length];
        if (!afterChar || !/[a-z0-9_]/.test(afterChar)) {
          tokens.push({ type: "number", value: String(variables[name]) });
          i += name.length;
          matched = true;
          break;
        }
      }
    }
    if (matched) continue;

    // Operators
    if ("+-*/".includes(expr[i])) {
      tokens.push({ type: "op", value: expr[i] });
      i++;
      continue;
    }

    // Parentheses
    if (expr[i] === "(") { tokens.push({ type: "lparen", value: "(" }); i++; continue; }
    if (expr[i] === ")") { tokens.push({ type: "rparen", value: ")" }); i++; continue; }

    throw new Error(`Unexpected character in formula: '${expr[i]}' at position ${i}`);
  }

  return tokens;
}

/**
 * Recursive descent parser for arithmetic expressions.
 * Grammar:
 *   expr     → term (('+' | '-') term)*
 *   term     → unary (('*' | '/') unary)*
 *   unary    → '-' unary | primary
 *   primary  → NUMBER | FUNC '(' expr ')' | '(' expr ')'
 */
class FormulaParser {
  pos = 0;
  constructor(public tokens: Token[]) {}

  parseExpression(): number {
    let left = this.parseTerm();
    while (this.pos < this.tokens.length && this.tokens[this.pos].type === "op" &&
           (this.tokens[this.pos].value === "+" || this.tokens[this.pos].value === "-")) {
      const op = this.tokens[this.pos++].value;
      const right = this.parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  private parseTerm(): number {
    let left = this.parseUnary();
    while (this.pos < this.tokens.length && this.tokens[this.pos].type === "op" &&
           (this.tokens[this.pos].value === "*" || this.tokens[this.pos].value === "/")) {
      const op = this.tokens[this.pos++].value;
      const right = this.parseUnary();
      left = op === "*" ? left * right : left / right;
    }
    return left;
  }

  private parseUnary(): number {
    if (this.pos < this.tokens.length && this.tokens[this.pos].type === "op" && this.tokens[this.pos].value === "-") {
      this.pos++;
      return -this.parseUnary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): number {
    const token = this.tokens[this.pos];
    if (!token) throw new Error("Unexpected end of formula");

    // Function call: ceil(expr), floor(expr), round(expr)
    if (token.type === "func") {
      const funcName = token.value;
      this.pos++; // consume func name
      if (this.tokens[this.pos]?.type !== "lparen") throw new Error(`Expected '(' after ${funcName}`);
      this.pos++; // consume (
      const value = this.parseExpression();
      if (this.tokens[this.pos]?.type !== "rparen") throw new Error(`Expected ')' after ${funcName} argument`);
      this.pos++; // consume )
      if (funcName === "ceil") return Math.ceil(value);
      if (funcName === "floor") return Math.floor(value);
      if (funcName === "round") return Math.round(value);
      throw new Error(`Unknown function: ${funcName}`);
    }

    // Number literal
    if (token.type === "number") {
      this.pos++;
      return parseFloat(token.value);
    }

    // Parenthesized expression
    if (token.type === "lparen") {
      this.pos++; // consume (
      const value = this.parseExpression();
      if (this.tokens[this.pos]?.type !== "rparen") throw new Error("Expected closing ')'");
      this.pos++; // consume )
      return value;
    }

    throw new Error(`Unexpected token: ${token.value}`);
  }
}

// ---------- Template-based BOM ----------

export async function calculateBOM(
  ctx: UserContext,
  input: BOMInput
): Promise<BOMResult> {
  assertPermission(ctx, "estimates", "create");

  // Try template-based first (unless explicitly requesting AI)
  if (!input.useAI) {
    const templateResult = await calculateBOMFromTemplate(ctx, input);
    if (templateResult) return templateResult;
  }

  // Fall back to AI
  if (isAIConfigured()) {
    return generateBOMWithAI(ctx, input);
  }

  return { source: "template", options: [] };
}

async function calculateBOMFromTemplate(
  ctx: UserContext,
  input: BOMInput
): Promise<BOMResult | null> {
  // Find matching template
  const [template] = await db
    .select()
    .from(estimateTemplates)
    .where(
      and(
        eq(estimateTemplates.tenantId, ctx.tenantId),
        eq(estimateTemplates.isActive, true),
        eq(estimateTemplates.autoApplyForJobType, true),
        eq(estimateTemplates.jobType, input.jobType)
      )
    )
    .limit(1);

  if (!template) return null;

  // Build formula variables
  const area = input.areaSqft ?? (input.length ?? 0) * (input.width ?? 0);
  const length = input.length ?? Math.sqrt(area);
  const width = input.width ?? (area > 0 ? area / length : 0);
  const perimeter = 2 * (length + width);
  const posts = Math.ceil(perimeter / 8);

  const variables: Record<string, number> = {
    area,
    length,
    width,
    perimeter,
    posts,
  };

  // Fetch template options + items
  const options = await db
    .select()
    .from(estimateTemplateOptions)
    .where(
      and(
        eq(estimateTemplateOptions.templateId, template.id),
        eq(estimateTemplateOptions.tenantId, ctx.tenantId)
      )
    )
    .orderBy(asc(estimateTemplateOptions.sortOrder));

  const bomOptions: BOMOption[] = [];

  for (const option of options) {
    const items = await db
      .select()
      .from(estimateTemplateItems)
      .where(
        and(
          eq(estimateTemplateItems.optionId, option.id),
          eq(estimateTemplateItems.tenantId, ctx.tenantId)
        )
      )
      .orderBy(asc(estimateTemplateItems.sortOrder));

    const bomItems: BOMItem[] = [];

    for (const item of items) {
      let quantity: number;

      if (item.quantityFormula) {
        try {
          quantity = Math.max(1, Math.ceil(evaluateFormula(item.quantityFormula, variables)));
        } catch {
          // Fall back to baseQuantity or static quantity
          quantity = Number(item.baseQuantity ?? item.quantity);
        }
      } else {
        quantity = Number(item.baseQuantity ?? item.quantity);
      }

      // Fetch current pricebook price if linked
      let unitPrice = Number(item.unitPrice);
      if (item.pricebookItemId) {
        const [pbItem] = await db
          .select({ unitPrice: pricebookItems.unitPrice })
          .from(pricebookItems)
          .where(
            and(
              eq(pricebookItems.id, item.pricebookItemId),
              eq(pricebookItems.tenantId, ctx.tenantId)
            )
          )
          .limit(1);
        if (pbItem) {
          unitPrice = Number(pbItem.unitPrice);
        }
      }

      bomItems.push({
        pricebookItemId: item.pricebookItemId ?? undefined,
        description: item.description,
        quantity,
        unitPrice,
        type: item.type,
      });
    }

    const total = bomItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    bomOptions.push({
      name: option.name,
      description: option.description ?? "",
      isRecommended: option.isRecommended,
      items: bomItems,
      total,
    });
  }

  return { source: "template", options: bomOptions };
}

// ---------- AI-based BOM ----------

async function generateBOMWithAI(
  ctx: UserContext,
  input: BOMInput
): Promise<BOMResult> {
  const client = getAIClient();

  // Fetch tenant's active pricebook items
  const pbItems = await db
    .select({
      id: pricebookItems.id,
      name: pricebookItems.name,
      sku: pricebookItems.sku,
      category: pricebookItems.category,
      unitPrice: pricebookItems.unitPrice,
      unit: pricebookItems.unit,
      type: pricebookItems.type,
    })
    .from(pricebookItems)
    .where(
      and(
        eq(pricebookItems.tenantId, ctx.tenantId),
        eq(pricebookItems.isActive, true)
      )
    );

  const catalog = pbItems
    .map((i) => `- ${i.name} (SKU: ${i.sku || "N/A"}, $${i.unitPrice}/${i.unit || "each"}, category: ${i.category || "N/A"})`)
    .join("\n");

  const area = input.areaSqft ?? (input.length ?? 0) * (input.width ?? 0);
  const dims = [];
  if (area > 0) dims.push(`Area: ${area} sqft`);
  if (input.length) dims.push(`Length: ${input.length} ft`);
  if (input.width) dims.push(`Width: ${input.width} ft`);

  const prompt = `Generate a bill of materials for a "${input.jobType}" job.
${dims.length > 0 ? `Dimensions: ${dims.join(", ")}` : "No dimensions provided."}
${input.description ? `Description: ${input.description}` : ""}

Available pricebook items:
${catalog || "No pricebook items available."}

Create a single recommended option with all required materials and quantities.
Match items to the pricebook catalog above by name when possible.
For items not in the pricebook, include them with estimated pricing.

Respond with ONLY valid JSON (no markdown):
{
  "items": [
    {
      "pricebookName": "<exact name from catalog or null if not in catalog>",
      "description": "<item description>",
      "quantity": <number>,
      "unitPrice": <number>,
      "type": "material",
      "isEstimated": <true if not in catalog>
    }
  ]
}`;

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return { source: "ai", options: [] };
  }

  let jsonStr = textBlock.text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  const parsed = JSON.parse(jsonStr) as {
    items: Array<{
      pricebookName?: string | null;
      description: string;
      quantity: number;
      unitPrice: number;
      type: string;
      isEstimated?: boolean;
    }>;
  };

  // Build a name→pricebook lookup (case-insensitive)
  const pbLookup = new Map<string, (typeof pbItems)[number]>();
  for (const item of pbItems) {
    pbLookup.set(item.name.toLowerCase(), item);
  }

  const bomItems: BOMItem[] = parsed.items.map((aiItem) => {
    // Try to match to pricebook
    let matched: (typeof pbItems)[number] | undefined;
    if (aiItem.pricebookName) {
      matched = pbLookup.get(aiItem.pricebookName.toLowerCase());
      // Fuzzy: try partial match
      if (!matched) {
        const searchTerm = aiItem.pricebookName.toLowerCase();
        for (const [name, item] of pbLookup) {
          if (name.includes(searchTerm) || searchTerm.includes(name)) {
            matched = item;
            break;
          }
        }
      }
    }

    return {
      pricebookItemId: matched?.id,
      description: matched?.name ?? aiItem.description,
      quantity: Math.max(1, Math.ceil(aiItem.quantity)),
      unitPrice: matched ? Number(matched.unitPrice) : aiItem.unitPrice,
      type: matched?.type ?? aiItem.type ?? "material",
      isEstimated: !matched,
    };
  });

  const total = bomItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  return {
    source: "ai",
    options: [
      {
        name: `${input.jobType} - AI Generated`,
        description: `Bill of materials for ${input.jobType}${area > 0 ? ` (${area} sqft)` : ""}`,
        isRecommended: true,
        items: bomItems,
        total,
      },
    ],
  };
}
