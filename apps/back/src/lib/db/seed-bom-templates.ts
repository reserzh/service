import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@fieldservice/shared/db/schema";
import { eq, and } from "drizzle-orm";

const client = postgres(
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:54332/postgres",
  { prepare: false }
);
const db = drizzle(client, { schema });

interface BOMTemplateItem {
  description: string;
  quantityFormula?: string;
  baseQuantity?: number;
  unitPrice: number;
  type: "material" | "service" | "labor";
}

interface BOMTemplate {
  name: string;
  jobType: string;
  summary: string;
  description: string;
  option: {
    name: string;
    description: string;
    items: BOMTemplateItem[];
  };
}

const BOM_TEMPLATES: BOMTemplate[] = [
  {
    name: "Pergola Installation BOM",
    jobType: "Pergola",
    summary: "Bill of materials for pergola construction",
    description: "Auto-generates materials list scaled to pergola dimensions",
    option: {
      name: "Pergola Materials",
      description: "Standard pergola build materials",
      items: [
        { description: "6x6 Posts", quantityFormula: "ceil(perimeter / 8)", unitPrice: 45.00, type: "material" },
        { description: "2x4 Beams", quantityFormula: "ceil(perimeter / 4)", unitPrice: 12.00, type: "material" },
        { description: "Concrete Bags (60lb)", quantityFormula: "posts * 2", unitPrice: 6.50, type: "material" },
        { description: "Hardware Kit (brackets, screws)", baseQuantity: 1, unitPrice: 85.00, type: "material" },
        { description: "Exterior Stain (gallon)", quantityFormula: "ceil(area / 200)", unitPrice: 38.00, type: "material" },
        { description: "Pergola Construction Labor", quantityFormula: "ceil(area / 50)", unitPrice: 75.00, type: "labor" },
      ],
    },
  },
  {
    name: "Paver Installation BOM",
    jobType: "Paver Installation",
    summary: "Bill of materials for paver/hardscape installation",
    description: "Auto-generates materials list scaled to paved area dimensions",
    option: {
      name: "Paver Materials",
      description: "Standard paver installation materials",
      items: [
        { description: "Pavers (per sqft, +10% waste)", quantityFormula: "ceil(area * 1.1)", unitPrice: 4.50, type: "material" },
        { description: "Base Gravel (tons)", quantityFormula: "ceil(area * 0.05)", unitPrice: 45.00, type: "material" },
        { description: "Polymeric Sand (bags)", quantityFormula: "ceil(area / 100)", unitPrice: 28.00, type: "material" },
        { description: "Edge Restraints (8ft sections)", quantityFormula: "ceil(perimeter / 8)", unitPrice: 14.00, type: "material" },
        { description: "Landscape Fabric (sqft)", quantityFormula: "ceil(area * 1.05)", unitPrice: 0.35, type: "material" },
        { description: "Paver Installation Labor", quantityFormula: "ceil(area / 20)", unitPrice: 75.00, type: "labor" },
      ],
    },
  },
  {
    name: "Artificial Turf BOM",
    jobType: "Artificial Turf",
    summary: "Bill of materials for artificial turf installation",
    description: "Auto-generates materials list scaled to turf area dimensions",
    option: {
      name: "Turf Materials",
      description: "Standard artificial turf installation materials",
      items: [
        { description: "Artificial Turf (sqft, +5% waste)", quantityFormula: "ceil(area * 1.05)", unitPrice: 6.50, type: "material" },
        { description: "Infill Material (bags)", quantityFormula: "ceil(area / 20)", unitPrice: 32.00, type: "material" },
        { description: "Seam Tape (ft)", quantityFormula: "ceil(width)", unitPrice: 2.50, type: "material" },
        { description: "Landscape Staples", quantityFormula: "ceil(perimeter / 2)", unitPrice: 0.75, type: "material" },
        { description: "Base Material (tons)", quantityFormula: "ceil(area * 0.04)", unitPrice: 45.00, type: "material" },
        { description: "Turf Installation Labor", quantityFormula: "ceil(area / 30)", unitPrice: 75.00, type: "labor" },
      ],
    },
  },
  {
    name: "Fence Installation BOM",
    jobType: "Fence",
    summary: "Bill of materials for fence installation",
    description: "Auto-generates materials list scaled to fence perimeter",
    option: {
      name: "Fence Materials",
      description: "Standard wood fence materials",
      items: [
        { description: "Fence Posts (4x4)", quantityFormula: "ceil(perimeter / 8)", unitPrice: 18.00, type: "material" },
        { description: "Rails (2x4, 8ft)", quantityFormula: "ceil(perimeter / 4) * 2", unitPrice: 8.50, type: "material" },
        { description: "Pickets", quantityFormula: "ceil(perimeter * 2)", unitPrice: 3.25, type: "material" },
        { description: "Concrete Bags (60lb)", quantityFormula: "posts * 2", unitPrice: 6.50, type: "material" },
        { description: "Post Caps", quantityFormula: "ceil(perimeter / 8)", unitPrice: 5.00, type: "material" },
        { description: "Fence Installation Labor", quantityFormula: "ceil(perimeter / 10)", unitPrice: 75.00, type: "labor" },
      ],
    },
  },
  {
    name: "Sod Installation BOM",
    jobType: "Sod Installation",
    summary: "Bill of materials for sod/lawn installation",
    description: "Auto-generates materials list scaled to lawn area",
    option: {
      name: "Sod Materials",
      description: "Standard sod installation materials",
      items: [
        { description: "Sod Rolls (sqft, +5% waste)", quantityFormula: "ceil(area * 1.05)", unitPrice: 0.85, type: "material" },
        { description: "Topsoil (cubic yards)", quantityFormula: "ceil(area / 100)", unitPrice: 45.00, type: "material" },
        { description: "Starter Fertilizer (bags)", quantityFormula: "ceil(area / 2500)", unitPrice: 32.00, type: "material" },
        { description: "Sod Installation Labor", quantityFormula: "ceil(area / 50)", unitPrice: 75.00, type: "labor" },
      ],
    },
  },
];

async function seedBOMTemplates() {
  console.log("Seeding BOM estimate templates...\n");

  // Get tenants to seed for
  const tenants = await db.select({ id: schema.tenants.id, name: schema.tenants.name }).from(schema.tenants);

  if (tenants.length === 0) {
    console.log("No tenants found. Run the main seed first.");
    process.exit(1);
  }

  for (const tenant of tenants) {
    console.log(`Tenant: ${tenant.name}`);

    for (const tmpl of BOM_TEMPLATES) {
      // Check if template already exists for this tenant + job type
      const [existing] = await db
        .select({ id: schema.estimateTemplates.id })
        .from(schema.estimateTemplates)
        .where(
          and(
            eq(schema.estimateTemplates.tenantId, tenant.id),
            eq(schema.estimateTemplates.jobType, tmpl.jobType)
          )
        )
        .limit(1);

      if (existing) {
        console.log(`  Skipping "${tmpl.name}" — already exists`);
        continue;
      }

      // Create template
      const [template] = await db
        .insert(schema.estimateTemplates)
        .values({
          tenantId: tenant.id,
          name: tmpl.name,
          description: tmpl.description,
          summary: tmpl.summary,
          jobType: tmpl.jobType,
          autoApplyForJobType: true,
        })
        .returning();

      // Create option
      const [option] = await db
        .insert(schema.estimateTemplateOptions)
        .values({
          tenantId: tenant.id,
          templateId: template.id,
          name: tmpl.option.name,
          description: tmpl.option.description,
          isRecommended: true,
          sortOrder: 0,
        })
        .returning();

      // Create items
      await db.insert(schema.estimateTemplateItems).values(
        tmpl.option.items.map((item, idx) => ({
          tenantId: tenant.id,
          optionId: option.id,
          description: item.description,
          quantity: String(item.baseQuantity ?? 1),
          unitPrice: String(item.unitPrice),
          type: item.type,
          quantityFormula: item.quantityFormula ?? null,
          baseQuantity: item.baseQuantity != null ? String(item.baseQuantity) : null,
          sortOrder: idx,
        }))
      );

      console.log(`  Created "${tmpl.name}" with ${tmpl.option.items.length} items`);
    }
  }

  console.log("\nDone!");
  process.exit(0);
}

seedBOMTemplates().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
