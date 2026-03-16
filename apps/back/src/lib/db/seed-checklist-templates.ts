import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@fieldservice/shared/db/schema";

const TENANT_ID = process.env.TENANT_ID ?? "d7add4c5-68cd-4a33-b835-e9383eeecd7e";

const client = postgres(process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:54332/postgres", {
  prepare: false,
});
const db = drizzle(client, { schema });

interface TemplateItem {
  label: string;
  groupName: string;
  groupSortOrder: number;
  sortOrder: number;
}

interface TemplateDefinition {
  name: string;
  description: string;
  jobType: string;
  items: TemplateItem[];
}

function buildGroup(groupName: string, groupSortOrder: number, labels: string[]): TemplateItem[] {
  return labels.map((label, i) => ({
    label,
    groupName,
    groupSortOrder,
    sortOrder: i,
  }));
}

const templates: TemplateDefinition[] = [
  {
    name: "Mowing",
    description: "Standard mowing job checklist with equipment and safety gear",
    jobType: "Mowing",
    items: [
      ...buildGroup("Equipment", 0, [
        "Walk-behind mower",
        "String trimmer",
        "Edger",
        "Blower",
        "Fuel cans",
      ]),
      ...buildGroup("Safety", 1, [
        "Ear protection",
        "Safety glasses",
        "High-vis vest",
      ]),
    ],
  },
  {
    name: "Paver Installation",
    description: "Paver installation checklist with equipment, materials, and safety gear",
    jobType: "Paver Installation",
    items: [
      ...buildGroup("Equipment", 0, [
        "Plate compactor",
        "Wet saw",
        "Rubber mallet",
        "Level",
        "Hand tamper",
        "Wheelbarrow",
      ]),
      ...buildGroup("Materials", 1, [
        "Pavers",
        "Polymeric sand",
        "Base gravel",
        "Edge restraints",
        "Landscape fabric",
      ]),
      ...buildGroup("Safety", 2, [
        "Knee pads",
        "Safety glasses",
        "Dust mask",
        "Gloves",
      ]),
    ],
  },
  {
    name: "Artificial Turf",
    description: "Artificial turf installation checklist with equipment, materials, and safety gear",
    jobType: "Artificial Turf",
    items: [
      ...buildGroup("Equipment", 0, [
        "Sod cutter",
        "Plate compactor",
        "Utility knife",
        "Turf roller",
        "Power broom",
      ]),
      ...buildGroup("Materials", 1, [
        "Turf rolls",
        "Infill material",
        "Seam tape",
        "Landscape staples",
        "Base material",
        "Weed barrier",
      ]),
      ...buildGroup("Safety", 2, [
        "Gloves",
        "Knee pads",
        "Safety glasses",
      ]),
    ],
  },
  {
    name: "Gravel Work",
    description: "Gravel and aggregate work checklist with equipment, materials, and safety gear",
    jobType: "Gravel Work",
    items: [
      ...buildGroup("Equipment", 0, [
        "Wheelbarrow",
        "Landscape rake",
        "Plate compactor",
        "Shovel",
        "Edger",
      ]),
      ...buildGroup("Materials", 1, [
        "Gravel/aggregate",
        "Landscape fabric",
        "Edge restraints",
      ]),
      ...buildGroup("Safety", 2, [
        "Gloves",
        "Safety glasses",
        "Dust mask",
        "Steel-toe boots",
      ]),
    ],
  },
  {
    name: "Aeration & Fertilization",
    description: "Lawn aeration and fertilization checklist with equipment, materials, and safety gear",
    jobType: "Aeration/Fertilization",
    items: [
      ...buildGroup("Equipment", 0, [
        "Core aerator",
        "Broadcast spreader",
        "Garden hose",
      ]),
      ...buildGroup("Materials", 1, [
        "Fertilizer",
        "Soil amendments",
        "Seed mix",
        "Marking flags",
      ]),
      ...buildGroup("Safety", 2, [
        "Gloves",
        "Safety glasses",
        "Dust mask",
      ]),
    ],
  },
  {
    name: "Tree & Shrub Trimming",
    description: "Tree and shrub trimming checklist with equipment, materials, and safety gear",
    jobType: "Tree/Shrub Trimming",
    items: [
      ...buildGroup("Equipment", 0, [
        "Pole saw",
        "Hand pruners",
        "Loppers",
        "Hedge trimmer",
        "Chainsaw",
      ]),
      ...buildGroup("Materials", 1, [
        "Pruning seal",
        "Disposal bags",
      ]),
      ...buildGroup("Safety", 2, [
        "Hard hat",
        "Safety glasses",
        "Gloves",
        "Chaps",
        "Ear protection",
      ]),
    ],
  },
  {
    name: "Irrigation",
    description: "Irrigation system installation and repair checklist with equipment, materials, and safety gear",
    jobType: "Irrigation",
    items: [
      ...buildGroup("Equipment", 0, [
        "Trencher",
        "Pipe cutter",
        "PVC glue kit",
        "Multimeter",
        "Wire strippers",
      ]),
      ...buildGroup("Materials", 1, [
        "PVC pipe",
        "Sprinkler heads",
        "Valves",
        "Wire connectors",
        "Teflon tape",
        "Drip tubing",
      ]),
      ...buildGroup("Safety", 2, [
        "Gloves",
        "Safety glasses",
        "Knee pads",
      ]),
    ],
  },
  {
    name: "Seasonal Cleanup",
    description: "Seasonal property cleanup checklist with equipment, materials, and safety gear",
    jobType: "Seasonal Cleanup",
    items: [
      ...buildGroup("Equipment", 0, [
        "Backpack blower",
        "Leaf rake",
        "Tarp",
        "Wheelbarrow",
        "Hand pruners",
      ]),
      ...buildGroup("Materials", 1, [
        "Disposal bags",
        "Mulch",
        "Compost",
      ]),
      ...buildGroup("Safety", 2, [
        "Gloves",
        "Safety glasses",
        "Dust mask",
      ]),
    ],
  },
];

async function seedChecklistTemplates() {
  console.log(`Seeding checklist templates for tenant ${TENANT_ID}...\n`);

  for (const template of templates) {
    console.log(`  Creating template: ${template.name} (jobType: ${template.jobType})`);

    const [inserted] = await db
      .insert(schema.checklistTemplates)
      .values({
        tenantId: TENANT_ID,
        name: template.name,
        description: template.description,
        jobType: template.jobType,
        isActive: true,
        autoApplyOnDispatch: true,
      })
      .onConflictDoNothing()
      .returning({ id: schema.checklistTemplates.id });

    if (!inserted) {
      console.log(`    -> Already exists, skipping items`);
      continue;
    }

    const templateId = inserted.id;
    console.log(`    -> Created with ID: ${templateId}`);

    const itemValues = template.items.map((item) => ({
      tenantId: TENANT_ID,
      templateId,
      label: item.label,
      groupName: item.groupName,
      groupSortOrder: item.groupSortOrder,
      sortOrder: item.sortOrder,
    }));

    await db.insert(schema.checklistTemplateItems).values(itemValues);
    console.log(`    -> Inserted ${itemValues.length} items`);
  }

  console.log("\nChecklist template seeding complete!");
}

seedChecklistTemplates()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => {
    client.end();
  });
