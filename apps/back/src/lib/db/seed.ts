import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@fieldservice/shared/db/schema";

const TENANT_ID = "d7add4c5-68cd-4a33-b835-e9383eeecd7e";
const ADMIN_ID = "6cc91fa8-c7db-4fc8-afa5-34160bf42ab0";

// Supabase local dev — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
// or run: npx supabase status to get values after `supabase start`
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54331";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SERVICE_ROLE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required. Set it in .env.local or pass as env var.");
  process.exit(1);
}

const client = postgres(process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:54332/postgres", {
  prepare: false,
});
const db = drizzle(client, { schema });

// Helper to create a Supabase Auth user
async function createAuthUser(email: string, password: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const data = await res.json();
  if (!res.ok) {
    // User might already exist
    if (data.msg?.includes("already") || data.message?.includes("already")) {
      console.log(`  Auth user ${email} already exists, skipping`);
      // Look up existing user
      const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=50`, {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      });
      const listData = await listRes.json();
      const existing = listData.users?.find((u: { email: string }) => u.email === email);
      if (existing) return existing.id;
      throw new Error(`Cannot find existing auth user for ${email}`);
    }
    throw new Error(`Failed to create auth user ${email}: ${JSON.stringify(data)}`);
  }
  return data.id;
}

async function seed() {
  console.log("Seeding FieldService Pro...\n");

  // --- Tenant ---
  console.log("Creating tenant...");
  await db
    .insert(schema.tenants)
    .values({
      id: TENANT_ID,
      name: "Comfort Pro HVAC",
      slug: "comfort-pro",
      email: "info@comfortprohvac.com",
      subscriptionStatus: "active",
      subscriptionPlan: "professional",
    })
    .onConflictDoNothing();
  console.log("  Comfort Pro HVAC");

  // --- Admin user (create auth user first) ---
  console.log("\nCreating admin user...");
  const adminAuthId = await createAuthUser("admin@test.com", "password123");
  await db
    .insert(schema.users)
    .values({
      id: adminAuthId,
      tenantId: TENANT_ID,
      email: "admin@test.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      isActive: true,
      canBeDispatched: false,
    })
    .onConflictDoNothing();
  console.log("  Admin User (admin)");

  // Override ADMIN_ID with actual auth ID for foreign keys
  const effectiveAdminId = adminAuthId;

  // --- Users (create auth users first, then app users) ---
  console.log("\nCreating users...");

  const techUsers = [
    { email: "mike.johnson@test.com", firstName: "Mike", lastName: "Johnson", role: "technician" as const, color: "#ef4444", hourlyRate: "85.00" },
    { email: "sarah.williams@test.com", firstName: "Sarah", lastName: "Williams", role: "technician" as const, color: "#8b5cf6", hourlyRate: "90.00" },
    { email: "carlos.rodriguez@test.com", firstName: "Carlos", lastName: "Rodriguez", role: "technician" as const, color: "#f59e0b", hourlyRate: "80.00" },
  ];

  const officeUsers = [
    { email: "jenny.clark@test.com", firstName: "Jenny", lastName: "Clark", role: "office_manager" as const, color: "#10b981" },
    { email: "dave.dispatcher@test.com", firstName: "Dave", lastName: "Thompson", role: "dispatcher" as const, color: "#06b6d4" },
  ];

  const userIds: Record<string, string> = { "admin@test.com": effectiveAdminId };

  for (const u of [...techUsers, ...officeUsers]) {
    const authId = await createAuthUser(u.email, "password123");
    userIds[u.email] = authId;

    await db
      .insert(schema.users)
      .values({
        id: authId,
        tenantId: TENANT_ID,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        color: u.color,
        isActive: true,
        canBeDispatched: u.role === "technician",
        hourlyRate: "hourlyRate" in u ? u.hourlyRate : null,
      })
      .onConflictDoNothing();

    console.log(`  ${u.firstName} ${u.lastName} (${u.role})`);
  }

  // --- Customers ---
  console.log("\nCreating customers...");

  const customersData = [
    { firstName: "Robert", lastName: "Anderson", email: "r.anderson@email.com", phone: "(555) 100-2001", type: "residential" as const, source: "Google", companyName: null },
    { firstName: "Patricia", lastName: "Martinez", email: "p.martinez@email.com", phone: "(555) 100-2002", type: "residential" as const, source: "Referral", companyName: null },
    { firstName: "James", lastName: "Taylor", email: "j.taylor@email.com", phone: "(555) 100-2003", type: "residential" as const, source: "Website", companyName: null },
    { firstName: "Linda", lastName: "Thomas", email: "l.thomas@email.com", phone: "(555) 100-2004", type: "residential" as const, source: "Yelp", companyName: null },
    { firstName: "Michael", lastName: "Brown", email: "m.brown@email.com", phone: "(555) 100-2005", type: "residential" as const, source: "Google", companyName: null },
    { firstName: "Elizabeth", lastName: "Davis", email: "e.davis@email.com", phone: "(555) 100-2006", type: "residential" as const, source: "Referral", companyName: null },
    { firstName: "William", lastName: "Garcia", email: "w.garcia@email.com", phone: "(555) 100-2007", type: "residential" as const, source: "Yard Sign", companyName: null },
    { firstName: "Barbara", lastName: "Wilson", email: "b.wilson@email.com", phone: "(555) 100-2008", type: "residential" as const, source: "Nextdoor", companyName: null },
    { firstName: "Tom", lastName: "Reynolds", email: "t.reynolds@oakridgepm.com", phone: "(555) 200-3001", type: "commercial" as const, source: "Referral", companyName: "Oakridge Property Management" },
    { firstName: "Susan", lastName: "Chen", email: "s.chen@downtownmed.com", phone: "(555) 200-3002", type: "commercial" as const, source: "Website", companyName: "Downtown Medical Center" },
    { firstName: "Frank", lastName: "Mitchell", email: "f.mitchell@sunsetdining.com", phone: "(555) 200-3003", type: "commercial" as const, source: "Google", companyName: "Sunset Restaurant Group" },
    { firstName: "Karen", lastName: "Lopez", email: "k.lopez@brightstartdc.com", phone: "(555) 200-3004", type: "commercial" as const, source: "Referral", companyName: "Brightstart Daycare" },
  ];

  const customerIds: string[] = [];
  for (const c of customersData) {
    const [row] = await db
      .insert(schema.customers)
      .values({ tenantId: TENANT_ID, createdBy: effectiveAdminId, ...c })
      .returning({ id: schema.customers.id });
    customerIds.push(row.id);
    console.log(`  ${c.firstName} ${c.lastName}${c.companyName ? ` (${c.companyName})` : ""}`);
  }

  // --- Properties ---
  console.log("\nCreating properties...");

  const propertiesData = [
    { customerId: customerIds[0], name: "Home", addressLine1: "142 Maple Street", city: "Springfield", state: "IL", zip: "62701", isPrimary: true },
    { customerId: customerIds[1], name: "Home", addressLine1: "88 Oak Avenue", city: "Springfield", state: "IL", zip: "62702", isPrimary: true },
    { customerId: customerIds[2], name: "Home", addressLine1: "305 Elm Drive", city: "Springfield", state: "IL", zip: "62703", isPrimary: true },
    { customerId: customerIds[3], name: "Home", addressLine1: "1721 Pine Court", city: "Springfield", state: "IL", zip: "62704", isPrimary: true },
    { customerId: customerIds[4], name: "Home", addressLine1: "55 Cedar Lane", city: "Springfield", state: "IL", zip: "62701", isPrimary: true },
    { customerId: customerIds[5], name: "Home", addressLine1: "430 Birch Road", city: "Springfield", state: "IL", zip: "62702", isPrimary: true },
    { customerId: customerIds[6], name: "Home", addressLine1: "12 Walnut Street", city: "Springfield", state: "IL", zip: "62703", isPrimary: true },
    { customerId: customerIds[7], name: "Home", addressLine1: "897 Spruce Way", city: "Springfield", state: "IL", zip: "62704", isPrimary: true },
    { customerId: customerIds[8], name: "Main Office", addressLine1: "200 Commerce Blvd, Suite 100", city: "Springfield", state: "IL", zip: "62701", isPrimary: true },
    { customerId: customerIds[8], name: "Warehouse", addressLine1: "450 Industrial Parkway", city: "Springfield", state: "IL", zip: "62705", isPrimary: false },
    { customerId: customerIds[9], name: "Medical Center", addressLine1: "1000 Health Drive", city: "Springfield", state: "IL", zip: "62702", isPrimary: true },
    { customerId: customerIds[10], name: "Downtown Location", addressLine1: "75 Main Street", city: "Springfield", state: "IL", zip: "62701", isPrimary: true },
    { customerId: customerIds[10], name: "Westside Location", addressLine1: "3200 West Grand Ave", city: "Springfield", state: "IL", zip: "62704", isPrimary: false },
    { customerId: customerIds[11], name: "Daycare Center", addressLine1: "520 Learning Lane", city: "Springfield", state: "IL", zip: "62703", isPrimary: true },
  ];

  const propertyIds: string[] = [];
  for (const p of propertiesData) {
    const [row] = await db
      .insert(schema.properties)
      .values({ tenantId: TENANT_ID, ...p })
      .returning({ id: schema.properties.id });
    propertyIds.push(row.id);
  }
  console.log(`  Created ${propertyIds.length} properties`);

  // --- Equipment ---
  console.log("\nCreating equipment...");

  const equipmentData = [
    { customerId: customerIds[0], propertyId: propertyIds[0], type: "Central AC", brand: "Carrier", model: "24ACC636A003", serialNumber: "CA-2019-44821", installDate: "2019-06-15" },
    { customerId: customerIds[0], propertyId: propertyIds[0], type: "Gas Furnace", brand: "Carrier", model: "59TP6B080V17", serialNumber: "CF-2019-44822", installDate: "2019-06-15" },
    { customerId: customerIds[1], propertyId: propertyIds[1], type: "Heat Pump", brand: "Trane", model: "XR15", serialNumber: "TR-2021-78901", installDate: "2021-03-20" },
    { customerId: customerIds[2], propertyId: propertyIds[2], type: "Central AC", brand: "Lennox", model: "XC21", serialNumber: "LN-2018-55612", installDate: "2018-08-10" },
    { customerId: customerIds[2], propertyId: propertyIds[2], type: "Water Heater", brand: "Rheem", model: "PROG50-38N", serialNumber: "RH-2020-33445", installDate: "2020-11-02" },
    { customerId: customerIds[3], propertyId: propertyIds[3], type: "Mini Split", brand: "Mitsubishi", model: "MSZ-GL12NA", serialNumber: "MT-2022-91234", installDate: "2022-04-18" },
    { customerId: customerIds[4], propertyId: propertyIds[4], type: "Central AC", brand: "Goodman", model: "GSX140361", serialNumber: "GM-2017-66789", installDate: "2017-07-22", locationInProperty: "Basement" },
    { customerId: customerIds[9], propertyId: propertyIds[10], type: "Commercial RTU", brand: "Carrier", model: "50XC", serialNumber: "CA-2020-COM01", installDate: "2020-01-15", locationInProperty: "Roof - Unit 1" },
    { customerId: customerIds[9], propertyId: propertyIds[10], type: "Commercial RTU", brand: "Carrier", model: "50XC", serialNumber: "CA-2020-COM02", installDate: "2020-01-15", locationInProperty: "Roof - Unit 2" },
    { customerId: customerIds[10], propertyId: propertyIds[11], type: "Walk-in Cooler", brand: "Heatcraft", model: "PRO3", serialNumber: "HC-2021-WK01", installDate: "2021-09-05", locationInProperty: "Kitchen" },
  ];

  for (const e of equipmentData) {
    await db.insert(schema.equipment).values({ tenantId: TENANT_ID, ...e });
  }
  console.log(`  Created ${equipmentData.length} equipment records`);

  // --- Tenant Sequences ---
  console.log("\nSetting up sequences...");

  await db.insert(schema.tenantSequences).values([
    { tenantId: TENANT_ID, sequenceType: "job", prefix: "JOB", currentValue: 8 },
    { tenantId: TENANT_ID, sequenceType: "estimate", prefix: "EST", currentValue: 3 },
    { tenantId: TENANT_ID, sequenceType: "invoice", prefix: "INV", currentValue: 2 },
  ]).onConflictDoNothing();

  // --- Jobs ---
  console.log("\nCreating jobs...");

  const mikeId = userIds["mike.johnson@test.com"];
  const sarahId = userIds["sarah.williams@test.com"];
  const carlosId = userIds["carlos.rodriguez@test.com"];

  const now = new Date();
  const today = (h: number, m: number = 0) => {
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d;
  };
  const daysFromNow = (days: number, h: number = 9, m: number = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(h, m, 0, 0);
    return d;
  };
  const daysAgo = (days: number, h: number = 9, m: number = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const jobsData = [
    // Completed jobs
    {
      jobNumber: "JOB-0001", customerId: customerIds[0], propertyId: propertyIds[0], assignedTo: mikeId,
      status: "completed" as const, priority: "normal" as const, jobType: "Repair", serviceType: "HVAC",
      summary: "AC not cooling - compressor issue",
      description: "Customer reports AC running but not cooling. Likely compressor or refrigerant issue.",
      scheduledStart: daysAgo(5, 8), scheduledEnd: daysAgo(5, 11),
      actualStart: daysAgo(5, 8, 15), actualEnd: daysAgo(5, 10, 45),
      completedAt: daysAgo(5, 10, 45), totalAmount: "485.00",
    },
    {
      jobNumber: "JOB-0002", customerId: customerIds[1], propertyId: propertyIds[1], assignedTo: sarahId,
      status: "completed" as const, priority: "high" as const, jobType: "Repair", serviceType: "HVAC",
      summary: "Heat pump not heating in cold weather",
      description: "Heat pump blowing cold air. Customer using space heaters as backup.",
      scheduledStart: daysAgo(3, 9), scheduledEnd: daysAgo(3, 12),
      actualStart: daysAgo(3, 9, 10), actualEnd: daysAgo(3, 11, 30),
      completedAt: daysAgo(3, 11, 30), totalAmount: "320.00",
    },
    {
      jobNumber: "JOB-0003", customerId: customerIds[9], propertyId: propertyIds[10], assignedTo: carlosId,
      status: "completed" as const, priority: "emergency" as const, jobType: "Repair", serviceType: "HVAC",
      summary: "RTU failure - no heat in medical office",
      description: "Rooftop unit 1 not functioning. Medical office has no heat. Patients and staff affected.",
      scheduledStart: daysAgo(2, 7), scheduledEnd: daysAgo(2, 12),
      actualStart: daysAgo(2, 7, 30), actualEnd: daysAgo(2, 11),
      completedAt: daysAgo(2, 11), totalAmount: "1250.00",
    },
    // In-progress job
    {
      jobNumber: "JOB-0004", customerId: customerIds[4], propertyId: propertyIds[4], assignedTo: mikeId,
      status: "in_progress" as const, priority: "normal" as const, jobType: "Maintenance", serviceType: "HVAC",
      summary: "Annual AC tune-up and filter replacement",
      description: "Seasonal maintenance visit. Check refrigerant levels, clean coils, replace filters.",
      scheduledStart: today(13), scheduledEnd: today(15),
      actualStart: today(13, 10), totalAmount: "189.00",
    },
    // Dispatched jobs (today)
    {
      jobNumber: "JOB-0005", customerId: customerIds[3], propertyId: propertyIds[3], assignedTo: sarahId,
      status: "dispatched" as const, priority: "normal" as const, jobType: "Repair", serviceType: "HVAC",
      summary: "Mini split making loud noise",
      description: "Customer reports rattling/buzzing noise from indoor unit. Started last week.",
      scheduledStart: today(15), scheduledEnd: today(17),
      dispatchedAt: today(14, 30),
    },
    {
      jobNumber: "JOB-0006", customerId: customerIds[10], propertyId: propertyIds[11], assignedTo: carlosId,
      status: "dispatched" as const, priority: "high" as const, jobType: "Repair", serviceType: "Refrigeration",
      summary: "Walk-in cooler temperature rising",
      description: "Walk-in cooler not maintaining temp. Currently at 45F, should be 38F. Food safety concern.",
      scheduledStart: today(14), scheduledEnd: today(17),
      dispatchedAt: today(13, 45),
    },
    // Scheduled jobs (upcoming)
    {
      jobNumber: "JOB-0007", customerId: customerIds[5], propertyId: propertyIds[5], assignedTo: mikeId,
      status: "scheduled" as const, priority: "normal" as const, jobType: "Installation", serviceType: "HVAC",
      summary: "New thermostat installation - Ecobee Smart",
      description: "Customer purchased Ecobee premium thermostat. Remove old Honeywell, install and configure new unit.",
      scheduledStart: daysFromNow(1, 9), scheduledEnd: daysFromNow(1, 11),
    },
    {
      jobNumber: "JOB-0008", customerId: customerIds[8], propertyId: propertyIds[8], assignedTo: sarahId,
      status: "scheduled" as const, priority: "normal" as const, jobType: "Maintenance", serviceType: "HVAC",
      summary: "Quarterly HVAC inspection - commercial office",
      description: "Scheduled quarterly maintenance for Oakridge PM office. Inspect all units, change filters, check thermostats.",
      scheduledStart: daysFromNow(2, 8), scheduledEnd: daysFromNow(2, 12),
    },
    // New/unassigned jobs
    {
      jobNumber: "JOB-0009", customerId: customerIds[6], propertyId: propertyIds[6], assignedTo: null,
      status: "new" as const, priority: "normal" as const, jobType: "Diagnostic", serviceType: "HVAC",
      summary: "Uneven heating between rooms",
      description: "Customer reports some rooms much colder than others. May need duct inspection or balancing.",
    },
    {
      jobNumber: "JOB-0010", customerId: customerIds[7], propertyId: propertyIds[7], assignedTo: null,
      status: "new" as const, priority: "low" as const, jobType: "Estimate", serviceType: "HVAC",
      summary: "Quote for full system replacement",
      description: "Customer interested in replacing 15-year-old system. Wants quote for new high-efficiency unit.",
    },
    {
      jobNumber: "JOB-0011", customerId: customerIds[11], propertyId: propertyIds[13], assignedTo: null,
      status: "new" as const, priority: "high" as const, jobType: "Repair", serviceType: "HVAC",
      summary: "Daycare HVAC intermittent shutdown",
      description: "System shuts down randomly throughout the day. Restarts after 10-15 minutes. Children and staff affected.",
    },
  ];

  for (const j of jobsData) {
    await db.insert(schema.jobs).values({
      tenantId: TENANT_ID,
      createdBy: effectiveAdminId,
      ...j,
    });
    const statusIcon = { completed: "✓", in_progress: "►", dispatched: "→", scheduled: "○", new: "•", canceled: "✗" }[j.status];
    console.log(`  ${statusIcon} ${j.jobNumber} - ${j.summary} [${j.status}]`);
  }

  // --- Job Line Items for completed jobs ---
  console.log("\nCreating job line items...");

  // Get job IDs
  const allJobs = await db.select({ id: schema.jobs.id, jobNumber: schema.jobs.jobNumber }).from(schema.jobs);
  const jobIdMap = Object.fromEntries(allJobs.map((j) => [j.jobNumber, j.id]));

  const lineItemsData = [
    { jobId: jobIdMap["JOB-0001"], description: "Diagnostic fee", quantity: "1", unitPrice: "89.00", total: "89.00", type: "service" as const, sortOrder: 0 },
    { jobId: jobIdMap["JOB-0001"], description: "Capacitor replacement", quantity: "1", unitPrice: "45.00", total: "45.00", type: "material" as const, sortOrder: 1 },
    { jobId: jobIdMap["JOB-0001"], description: "Refrigerant recharge (2 lbs R-410A)", quantity: "2", unitPrice: "85.00", total: "170.00", type: "material" as const, sortOrder: 2 },
    { jobId: jobIdMap["JOB-0001"], description: "Labor (2.5 hrs)", quantity: "2.5", unitPrice: "72.00", total: "180.00", type: "labor" as const, sortOrder: 3 },

    { jobId: jobIdMap["JOB-0002"], description: "Heat pump diagnostic", quantity: "1", unitPrice: "89.00", total: "89.00", type: "service" as const, sortOrder: 0 },
    { jobId: jobIdMap["JOB-0002"], description: "Defrost control board", quantity: "1", unitPrice: "135.00", total: "135.00", type: "material" as const, sortOrder: 1 },
    { jobId: jobIdMap["JOB-0002"], description: "Labor (1.5 hrs)", quantity: "1.5", unitPrice: "64.00", total: "96.00", type: "labor" as const, sortOrder: 2 },

    { jobId: jobIdMap["JOB-0003"], description: "Emergency diagnostic - commercial", quantity: "1", unitPrice: "150.00", total: "150.00", type: "service" as const, sortOrder: 0 },
    { jobId: jobIdMap["JOB-0003"], description: "Inducer motor assembly", quantity: "1", unitPrice: "420.00", total: "420.00", type: "material" as const, sortOrder: 1 },
    { jobId: jobIdMap["JOB-0003"], description: "Ignitor replacement", quantity: "1", unitPrice: "80.00", total: "80.00", type: "material" as const, sortOrder: 2 },
    { jobId: jobIdMap["JOB-0003"], description: "Labor (4 hrs, emergency rate)", quantity: "4", unitPrice: "150.00", total: "600.00", type: "labor" as const, sortOrder: 3 },

    { jobId: jobIdMap["JOB-0004"], description: "Annual tune-up package", quantity: "1", unitPrice: "149.00", total: "149.00", type: "service" as const, sortOrder: 0 },
    { jobId: jobIdMap["JOB-0004"], description: "Air filter (20x25x1 MERV 11)", quantity: "2", unitPrice: "20.00", total: "40.00", type: "material" as const, sortOrder: 1 },
  ];

  for (const li of lineItemsData) {
    await db.insert(schema.jobLineItems).values({ tenantId: TENANT_ID, ...li });
  }
  console.log(`  Created ${lineItemsData.length} line items`);

  // --- Job Notes ---
  console.log("\nCreating job notes...");

  const notesData = [
    { jobId: jobIdMap["JOB-0001"], userId: mikeId, content: "Found capacitor failing and system low on refrigerant. Replaced capacitor and added 2 lbs R-410A. System running well, delta T at 18 degrees.", isInternal: false },
    { jobId: jobIdMap["JOB-0001"], userId: mikeId, content: "System is 5 years old - in decent shape overall. Recommend annual maintenance to prevent future issues.", isInternal: true },
    { jobId: jobIdMap["JOB-0002"], userId: sarahId, content: "Defrost control board was malfunctioning causing the heat pump to stay in cooling mode. Replaced board and tested through full defrost cycle. Operating normally.", isInternal: false },
    { jobId: jobIdMap["JOB-0003"], userId: carlosId, content: "Inducer motor seized - replaced along with ignitor which was cracked. Both RTUs inspected, unit 2 is fine. Recommend scheduling maintenance for both units.", isInternal: false },
    { jobId: jobIdMap["JOB-0003"], userId: effectiveAdminId, content: "High priority client - medical office. Always try to schedule same-day for them.", isInternal: true },
    { jobId: jobIdMap["JOB-0004"], userId: mikeId, content: "Starting tune-up. Coils are dirty, will need extra cleaning time.", isInternal: false },
  ];

  for (const n of notesData) {
    await db.insert(schema.jobNotes).values({ tenantId: TENANT_ID, ...n });
  }
  console.log(`  Created ${notesData.length} notes`);

  // --- Estimates ---
  console.log("\nCreating estimates...");

  const [est1] = await db
    .insert(schema.estimates)
    .values({
      tenantId: TENANT_ID,
      estimateNumber: "EST-0001",
      customerId: customerIds[7],
      propertyId: propertyIds[7],
      createdBy: effectiveAdminId,
      status: "sent",
      summary: "Full HVAC system replacement - 3 ton",
      notes: "Replacing existing 15-year-old Goodman system with new high-efficiency Carrier Infinity series.",
      validUntil: daysFromNow(30).toISOString().split("T")[0],
      sentAt: daysAgo(1),
      totalAmount: "8750.00",
    })
    .returning({ id: schema.estimates.id });

  // Create estimate options (Good / Better / Best)
  const [optGood] = await db
    .insert(schema.estimateOptions)
    .values({
      tenantId: TENANT_ID, estimateId: est1.id,
      name: "Standard", description: "Carrier Performance series 16 SEER", total: "7200.00", isRecommended: false, sortOrder: 0,
    })
    .returning({ id: schema.estimateOptions.id });

  const [optBetter] = await db
    .insert(schema.estimateOptions)
    .values({
      tenantId: TENANT_ID, estimateId: est1.id,
      name: "Recommended", description: "Carrier Infinity 19 SEER with variable speed", total: "8750.00", isRecommended: true, sortOrder: 1,
    })
    .returning({ id: schema.estimateOptions.id });

  const [optBest] = await db
    .insert(schema.estimateOptions)
    .values({
      tenantId: TENANT_ID, estimateId: est1.id,
      name: "Premium", description: "Carrier Infinity 24 SEER with Greenspeed intelligence", total: "12400.00", isRecommended: false, sortOrder: 2,
    })
    .returning({ id: schema.estimateOptions.id });

  // Option items
  const optionItemsData = [
    { optionId: optGood.id, description: "Carrier 24ACC636 - 3 ton AC (16 SEER)", quantity: "1", unitPrice: "3200.00", total: "3200.00", type: "material" as const, sortOrder: 0 },
    { optionId: optGood.id, description: "Carrier 59TP6 - 80% gas furnace", quantity: "1", unitPrice: "1800.00", total: "1800.00", type: "material" as const, sortOrder: 1 },
    { optionId: optGood.id, description: "Installation labor", quantity: "1", unitPrice: "2200.00", total: "2200.00", type: "labor" as const, sortOrder: 2 },

    { optionId: optBetter.id, description: "Carrier 24VNA936 - 3 ton AC (19 SEER)", quantity: "1", unitPrice: "4100.00", total: "4100.00", type: "material" as const, sortOrder: 0 },
    { optionId: optBetter.id, description: "Carrier 59MN7 - 96% variable speed furnace", quantity: "1", unitPrice: "2350.00", total: "2350.00", type: "material" as const, sortOrder: 1 },
    { optionId: optBetter.id, description: "Installation labor", quantity: "1", unitPrice: "2300.00", total: "2300.00", type: "labor" as const, sortOrder: 2 },

    { optionId: optBest.id, description: "Carrier 24VNA060 Greenspeed (24 SEER)", quantity: "1", unitPrice: "5800.00", total: "5800.00", type: "material" as const, sortOrder: 0 },
    { optionId: optBest.id, description: "Carrier 59MN7 - 98% modulating furnace", quantity: "1", unitPrice: "3200.00", total: "3200.00", type: "material" as const, sortOrder: 1 },
    { optionId: optBest.id, description: "Infinity smart thermostat", quantity: "1", unitPrice: "400.00", total: "400.00", type: "material" as const, sortOrder: 2 },
    { optionId: optBest.id, description: "Installation labor", quantity: "1", unitPrice: "3000.00", total: "3000.00", type: "labor" as const, sortOrder: 3 },
  ];

  for (const oi of optionItemsData) {
    await db.insert(schema.estimateOptionItems).values({ tenantId: TENANT_ID, ...oi });
  }
  console.log("  EST-0001 - Full HVAC replacement (3 options) [sent]");

  // Second estimate - approved
  const [est2] = await db
    .insert(schema.estimates)
    .values({
      tenantId: TENANT_ID,
      estimateNumber: "EST-0002",
      customerId: customerIds[2],
      propertyId: propertyIds[2],
      createdBy: effectiveAdminId,
      status: "approved",
      summary: "Water heater replacement - tankless upgrade",
      notes: "Replacing failing 50-gallon tank water heater with Rinnai tankless unit.",
      validUntil: daysFromNow(14).toISOString().split("T")[0],
      sentAt: daysAgo(5),
      viewedAt: daysAgo(4),
      approvedAt: daysAgo(3),
      totalAmount: "3200.00",
    })
    .returning({ id: schema.estimates.id });

  const [optOnly] = await db
    .insert(schema.estimateOptions)
    .values({
      tenantId: TENANT_ID, estimateId: est2.id,
      name: "Tankless Upgrade", description: "Rinnai RU199iN tankless water heater", total: "3200.00", isRecommended: true, sortOrder: 0,
    })
    .returning({ id: schema.estimateOptions.id });

  await db.insert(schema.estimateOptionItems).values([
    { tenantId: TENANT_ID, optionId: optOnly.id, description: "Rinnai RU199iN tankless water heater", quantity: "1", unitPrice: "1650.00", total: "1650.00", type: "material" as const, sortOrder: 0 },
    { tenantId: TENANT_ID, optionId: optOnly.id, description: "Venting and gas line modifications", quantity: "1", unitPrice: "450.00", total: "450.00", type: "material" as const, sortOrder: 1 },
    { tenantId: TENANT_ID, optionId: optOnly.id, description: "Installation labor (full day)", quantity: "1", unitPrice: "1100.00", total: "1100.00", type: "labor" as const, sortOrder: 2 },
  ]);

  // Update approved option reference
  await db.update(schema.estimates).set({ approvedOptionId: optOnly.id }).where(
    require("drizzle-orm").eq(schema.estimates.id, est2.id)
  );

  console.log("  EST-0002 - Tankless water heater upgrade [approved]");

  // Draft estimate
  await db.insert(schema.estimates).values({
    tenantId: TENANT_ID,
    estimateNumber: "EST-0003",
    customerId: customerIds[11],
    propertyId: propertyIds[13],
    createdBy: effectiveAdminId,
    status: "draft",
    summary: "Commercial HVAC maintenance contract - annual",
    notes: "Quarterly maintenance visits for daycare HVAC system. Includes filter changes and seasonal tune-ups.",
    totalAmount: "2400.00",
  });
  console.log("  EST-0003 - Commercial maintenance contract [draft]");

  // --- Invoices ---
  console.log("\nCreating invoices...");

  const [inv1] = await db
    .insert(schema.invoices)
    .values({
      tenantId: TENANT_ID,
      invoiceNumber: "INV-0001",
      customerId: customerIds[0],
      jobId: jobIdMap["JOB-0001"],
      createdBy: effectiveAdminId,
      status: "paid",
      dueDate: daysAgo(0).toISOString().split("T")[0],
      subtotal: "484.00",
      taxRate: "0.0725",
      taxAmount: "35.09",
      total: "519.09",
      amountPaid: "519.09",
      balanceDue: "0",
      paidAt: daysAgo(3),
      sentAt: daysAgo(5),
      viewedAt: daysAgo(4),
    })
    .returning({ id: schema.invoices.id });

  await db.insert(schema.invoiceLineItems).values([
    { tenantId: TENANT_ID, invoiceId: inv1.id, description: "Diagnostic fee", quantity: "1", unitPrice: "89.00", total: "89.00", type: "service" as const, sortOrder: 0 },
    { tenantId: TENANT_ID, invoiceId: inv1.id, description: "Capacitor replacement", quantity: "1", unitPrice: "45.00", total: "45.00", type: "material" as const, sortOrder: 1 },
    { tenantId: TENANT_ID, invoiceId: inv1.id, description: "Refrigerant (2 lbs R-410A)", quantity: "2", unitPrice: "85.00", total: "170.00", type: "material" as const, sortOrder: 2 },
    { tenantId: TENANT_ID, invoiceId: inv1.id, description: "Labor", quantity: "2.5", unitPrice: "72.00", total: "180.00", type: "labor" as const, sortOrder: 3 },
  ]);

  await db.insert(schema.payments).values({
    tenantId: TENANT_ID,
    invoiceId: inv1.id,
    customerId: customerIds[0],
    amount: "519.09",
    method: "credit_card",
    status: "succeeded",
    referenceNumber: "ch_test_001",
  });
  console.log("  INV-0001 - $519.09 [paid]");

  const [inv2] = await db
    .insert(schema.invoices)
    .values({
      tenantId: TENANT_ID,
      invoiceNumber: "INV-0002",
      customerId: customerIds[9],
      jobId: jobIdMap["JOB-0003"],
      createdBy: effectiveAdminId,
      status: "sent",
      dueDate: daysFromNow(15).toISOString().split("T")[0],
      subtotal: "1250.00",
      taxRate: "0.0725",
      taxAmount: "90.63",
      total: "1340.63",
      amountPaid: "0",
      balanceDue: "1340.63",
      sentAt: daysAgo(1),
    })
    .returning({ id: schema.invoices.id });

  await db.insert(schema.invoiceLineItems).values([
    { tenantId: TENANT_ID, invoiceId: inv2.id, description: "Emergency diagnostic - commercial", quantity: "1", unitPrice: "150.00", total: "150.00", type: "service" as const, sortOrder: 0 },
    { tenantId: TENANT_ID, invoiceId: inv2.id, description: "Inducer motor assembly", quantity: "1", unitPrice: "420.00", total: "420.00", type: "material" as const, sortOrder: 1 },
    { tenantId: TENANT_ID, invoiceId: inv2.id, description: "Ignitor replacement", quantity: "1", unitPrice: "80.00", total: "80.00", type: "material" as const, sortOrder: 2 },
    { tenantId: TENANT_ID, invoiceId: inv2.id, description: "Emergency labor (4 hrs)", quantity: "4", unitPrice: "150.00", total: "600.00", type: "labor" as const, sortOrder: 3 },
  ]);
  console.log("  INV-0002 - $1,340.63 [sent]");

  console.log("\n✅ Seed complete!\n");
  console.log("Summary:");
  console.log("  - 6 users (1 admin, 1 office manager, 1 dispatcher, 3 technicians)");
  console.log("  - 12 customers (8 residential, 4 commercial)");
  console.log("  - 14 properties");
  console.log("  - 10 equipment records");
  console.log("  - 11 jobs (3 completed, 1 in-progress, 2 dispatched, 2 scheduled, 3 new)");
  console.log("  - 3 estimates (1 sent, 1 approved, 1 draft)");
  console.log("  - 2 invoices (1 paid, 1 sent)");
  console.log("\nLogin: admin@test.com / password123");
  console.log("All other users also use password123");

  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
