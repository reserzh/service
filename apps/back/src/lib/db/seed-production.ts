import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "@fieldservice/shared/db/schema";

// ---------------------------------------------------------------------------
// Environment variables
// ---------------------------------------------------------------------------

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

const TENANT_NAME = requireEnv("TENANT_NAME");
const TENANT_SLUG = requireEnv("TENANT_SLUG");
const TENANT_EMAIL = requireEnv("TENANT_EMAIL");
const ADMIN_EMAIL = requireEnv("ADMIN_EMAIL");
const ADMIN_PASSWORD = requireEnv("ADMIN_PASSWORD");
const ADMIN_FIRST_NAME = process.env.ADMIN_FIRST_NAME ?? "Admin";
const ADMIN_LAST_NAME = process.env.ADMIN_LAST_NAME ?? "User";
const DATABASE_URL = requireEnv("DATABASE_URL");
const SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "";
if (!SUPABASE_URL) {
  console.error("Missing required: SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

const STAFF_PASSWORD = process.env.STAFF_PASSWORD ?? ADMIN_PASSWORD;
const TENANT_ID = crypto.randomUUID();

const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client, { schema });

// ---------------------------------------------------------------------------
// Supabase Auth helper
// ---------------------------------------------------------------------------

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
    if (data.msg?.includes("already") || data.message?.includes("already")) {
      console.log(`  Auth user ${email} already exists, looking up...`);
      const listRes = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=50`,
        {
          headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          },
        }
      );
      const listData = await listRes.json();
      const existing = listData.users?.find(
        (u: { email: string }) => u.email === email
      );
      if (existing) return existing.id;
      throw new Error(`Cannot find existing auth user for ${email}`);
    }
    throw new Error(`Failed to create auth user ${email}: ${JSON.stringify(data)}`);
  }
  return data.id;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

const now = new Date();

function today(h: number, m = 0): Date {
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  return d;
}

function daysFromNow(days: number, h = 9, m = 0): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(h, m, 0, 0);
  return d;
}

function daysAgo(days: number, h = 9, m = 0): Date {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(h, m, 0, 0);
  return d;
}

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------

async function seed() {
  console.log("Seeding FieldService Pro (production)...\n");

  // --- Tenant ---
  console.log("Creating tenant...");
  await db
    .insert(schema.tenants)
    .values({
      id: TENANT_ID,
      name: TENANT_NAME,
      slug: TENANT_SLUG,
      email: TENANT_EMAIL,
      subscriptionStatus: "active",
      subscriptionPlan: "professional",
    })
    .onConflictDoNothing();
  console.log(`  ${TENANT_NAME}`);

  // --- Admin user ---
  console.log("\nCreating admin user...");
  const adminAuthId = await createAuthUser(ADMIN_EMAIL, ADMIN_PASSWORD);
  await db
    .insert(schema.users)
    .values({
      id: adminAuthId,
      tenantId: TENANT_ID,
      email: ADMIN_EMAIL,
      firstName: ADMIN_FIRST_NAME,
      lastName: ADMIN_LAST_NAME,
      role: "admin",
      isActive: true,
      canBeDispatched: false,
    })
    .onConflictDoNothing();
  console.log(`  ${ADMIN_FIRST_NAME} ${ADMIN_LAST_NAME} (admin)`);

  // --- Staff users ---
  console.log("\nCreating staff users...");

  const emailDomain = TENANT_EMAIL.split("@")[1] ?? "example.com";

  const techUsers = [
    { email: `mike.johnson@${emailDomain}`, firstName: "Mike", lastName: "Johnson", role: "technician" as const, color: "#ef4444", hourlyRate: "85.00" },
    { email: `sarah.williams@${emailDomain}`, firstName: "Sarah", lastName: "Williams", role: "technician" as const, color: "#8b5cf6", hourlyRate: "90.00" },
    { email: `carlos.rodriguez@${emailDomain}`, firstName: "Carlos", lastName: "Rodriguez", role: "technician" as const, color: "#f59e0b", hourlyRate: "80.00" },
  ];

  const officeUsers = [
    { email: `jenny.clark@${emailDomain}`, firstName: "Jenny", lastName: "Clark", role: "office_manager" as const, color: "#10b981" },
    { email: `dave.thompson@${emailDomain}`, firstName: "Dave", lastName: "Thompson", role: "dispatcher" as const, color: "#06b6d4" },
  ];

  const userIds: Record<string, string> = { [ADMIN_EMAIL]: adminAuthId };

  for (const u of [...techUsers, ...officeUsers]) {
    const authId = await createAuthUser(u.email, STAFF_PASSWORD);
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
    { firstName: "Robert", lastName: "Anderson", email: "robert.anderson@homemail.com", phone: "(555) 201-4410", type: "residential" as const, source: "Google", companyName: null },
    { firstName: "Patricia", lastName: "Martinez", email: "patricia.martinez@mailbox.net", phone: "(555) 201-4411", type: "residential" as const, source: "Referral", companyName: null },
    { firstName: "James", lastName: "Taylor", email: "james.taylor@inbox.org", phone: "(555) 201-4412", type: "residential" as const, source: "Website", companyName: null },
    { firstName: "Linda", lastName: "Thomas", email: "linda.thomas@fastmail.com", phone: "(555) 201-4413", type: "residential" as const, source: "Yelp", companyName: null },
    { firstName: "Michael", lastName: "Brown", email: "michael.brown@homemail.com", phone: "(555) 201-4414", type: "residential" as const, source: "Google", companyName: null },
    { firstName: "Elizabeth", lastName: "Davis", email: "elizabeth.davis@mailbox.net", phone: "(555) 201-4415", type: "residential" as const, source: "Referral", companyName: null },
    { firstName: "William", lastName: "Garcia", email: "william.garcia@inbox.org", phone: "(555) 201-4416", type: "residential" as const, source: "Yard Sign", companyName: null },
    { firstName: "Barbara", lastName: "Wilson", email: "barbara.wilson@fastmail.com", phone: "(555) 201-4417", type: "residential" as const, source: "Nextdoor", companyName: null },
    { firstName: "Tom", lastName: "Reynolds", email: "treynolds@oakridgeproperties.com", phone: "(555) 302-7801", type: "commercial" as const, source: "Referral", companyName: "Oakridge Property Management" },
    { firstName: "Susan", lastName: "Chen", email: "schen@downtownmedical.org", phone: "(555) 302-7802", type: "commercial" as const, source: "Website", companyName: "Downtown Medical Center" },
    { firstName: "Frank", lastName: "Mitchell", email: "fmitchell@sunsetdining.com", phone: "(555) 302-7803", type: "commercial" as const, source: "Google", companyName: "Sunset Restaurant Group" },
    { firstName: "Karen", lastName: "Lopez", email: "klopez@brightstartdaycare.com", phone: "(555) 302-7804", type: "commercial" as const, source: "Referral", companyName: "Brightstart Daycare" },
  ];

  const customerIds: string[] = [];
  for (const c of customersData) {
    const [row] = await db
      .insert(schema.customers)
      .values({ tenantId: TENANT_ID, createdBy: adminAuthId, ...c })
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

  await db
    .insert(schema.tenantSequences)
    .values([
      { tenantId: TENANT_ID, sequenceType: "job", prefix: "JOB", currentValue: 8 },
      { tenantId: TENANT_ID, sequenceType: "estimate", prefix: "EST", currentValue: 3 },
      { tenantId: TENANT_ID, sequenceType: "invoice", prefix: "INV", currentValue: 2 },
    ])
    .onConflictDoNothing();

  // --- Jobs ---
  console.log("\nCreating jobs...");

  const mikeId = userIds[`mike.johnson@${emailDomain}`];
  const sarahId = userIds[`sarah.williams@${emailDomain}`];
  const carlosId = userIds[`carlos.rodriguez@${emailDomain}`];

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
      createdBy: adminAuthId,
      ...j,
    });
    const statusIcon = { completed: "\u2713", in_progress: "\u25B6", dispatched: "\u2192", scheduled: "\u25CB", new: "\u2022", canceled: "\u2717" }[j.status];
    console.log(`  ${statusIcon} ${j.jobNumber} - ${j.summary} [${j.status}]`);
  }

  // --- Job Line Items ---
  console.log("\nCreating job line items...");

  const allJobs = await db
    .select({ id: schema.jobs.id, jobNumber: schema.jobs.jobNumber })
    .from(schema.jobs)
    .where(eq(schema.jobs.tenantId, TENANT_ID));
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
    { jobId: jobIdMap["JOB-0003"], userId: adminAuthId, content: "High priority client - medical office. Always try to schedule same-day for them.", isInternal: true },
    { jobId: jobIdMap["JOB-0004"], userId: mikeId, content: "Starting tune-up. Coils are dirty, will need extra cleaning time.", isInternal: false },
  ];

  for (const n of notesData) {
    await db.insert(schema.jobNotes).values({ tenantId: TENANT_ID, ...n });
  }
  console.log(`  Created ${notesData.length} notes`);

  // --- Estimates ---
  console.log("\nCreating estimates...");

  // Estimate 1: Sent with Good/Better/Best options
  const [est1] = await db
    .insert(schema.estimates)
    .values({
      tenantId: TENANT_ID,
      estimateNumber: "EST-0001",
      customerId: customerIds[7],
      propertyId: propertyIds[7],
      createdBy: adminAuthId,
      status: "sent",
      summary: "Full HVAC system replacement - 3 ton",
      notes: "Replacing existing 15-year-old Goodman system with new high-efficiency Carrier Infinity series.",
      validUntil: daysFromNow(30).toISOString().split("T")[0],
      sentAt: daysAgo(1),
      totalAmount: "8750.00",
    })
    .returning({ id: schema.estimates.id });

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

  // Estimate 2: Approved
  const [est2] = await db
    .insert(schema.estimates)
    .values({
      tenantId: TENANT_ID,
      estimateNumber: "EST-0002",
      customerId: customerIds[2],
      propertyId: propertyIds[2],
      createdBy: adminAuthId,
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

  await db
    .update(schema.estimates)
    .set({ approvedOptionId: optOnly.id })
    .where(eq(schema.estimates.id, est2.id));
  console.log("  EST-0002 - Tankless water heater upgrade [approved]");

  // Estimate 3: Draft
  await db.insert(schema.estimates).values({
    tenantId: TENANT_ID,
    estimateNumber: "EST-0003",
    customerId: customerIds[11],
    propertyId: propertyIds[13],
    createdBy: adminAuthId,
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
      createdBy: adminAuthId,
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
    referenceNumber: "ch_prod_001",
  });
  console.log("  INV-0001 - $519.09 [paid]");

  const [inv2] = await db
    .insert(schema.invoices)
    .values({
      tenantId: TENANT_ID,
      invoiceNumber: "INV-0002",
      customerId: customerIds[9],
      jobId: jobIdMap["JOB-0003"],
      createdBy: adminAuthId,
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

  // --- Website: Site Settings ---
  console.log("\nCreating website...");

  await db
    .insert(schema.siteSettings)
    .values({
      tenantId: TENANT_ID,
      isPublished: true,
      subdomainSlug: TENANT_SLUG,
      theme: {
        primaryColor: "#2563eb",
        secondaryColor: "#1e40af",
        accentColor: "#f59e0b",
        fontBody: "Inter, sans-serif",
        fontHeading: "Inter, sans-serif",
        borderRadius: "0.5rem",
        style: "modern",
      },
      branding: {
        businessName: TENANT_NAME,
        tagline: "Professional Service You Can Trust",
        phone: "(555) 201-4400",
        email: TENANT_EMAIL,
      },
      seoDefaults: {
        title: `${TENANT_NAME} - Professional Field Service`,
        description: `${TENANT_NAME} provides expert HVAC, plumbing, and electrical services. Licensed, insured, and trusted by homeowners and businesses.`,
        keywords: [
          "HVAC",
          "heating",
          "cooling",
          "repair",
          "installation",
          "maintenance",
        ],
      },
    })
    .onConflictDoNothing();
  console.log("  Site settings configured");

  // --- Website: Service Catalog ---
  console.log("\nCreating service catalog...");

  const servicesData = [
    {
      name: "AC Repair",
      slug: "ac-repair",
      description:
        "Is your air conditioning not keeping up? Our certified technicians diagnose and repair all makes and models of central air conditioners, heat pumps, and ductless mini-splits. We stock common parts on our trucks for fast, same-day repairs.",
      shortDescription: "Fast, reliable AC repair for all makes and models.",
      icon: "Snowflake",
      priceDisplay: "Starting at $89",
      isBookable: true,
      estimatedDuration: 120,
      sortOrder: 0,
    },
    {
      name: "Heating Repair",
      slug: "heating-repair",
      description:
        "Don't get left in the cold. We service gas furnaces, heat pumps, boilers, and radiant heating systems. Our technicians arrive prepared with diagnostic tools and common replacement parts to get your heat running again quickly.",
      shortDescription: "Expert heating repair to keep you warm all winter.",
      icon: "Flame",
      priceDisplay: "Starting at $89",
      isBookable: true,
      estimatedDuration: 120,
      sortOrder: 1,
    },
    {
      name: "System Installation",
      slug: "system-installation",
      description:
        "Upgrading or replacing your HVAC system? We offer professional installation of high-efficiency air conditioners, furnaces, heat pumps, and complete comfort systems. Every installation includes a load calculation, equipment selection guidance, and a workmanship warranty.",
      shortDescription:
        "Professional HVAC installation with guaranteed workmanship.",
      icon: "Wrench",
      priceDisplay: "Free estimates",
      isBookable: true,
      estimatedDuration: 480,
      sortOrder: 2,
    },
    {
      name: "Maintenance & Tune-Up",
      slug: "maintenance-tune-up",
      description:
        "Preventative maintenance extends equipment life, improves efficiency, and catches small problems before they become expensive repairs. Our comprehensive tune-up includes filter replacement, coil cleaning, refrigerant check, electrical inspection, and a full system performance test.",
      shortDescription: "Keep your system running at peak performance.",
      icon: "Settings",
      priceDisplay: "From $149",
      isBookable: true,
      estimatedDuration: 90,
      sortOrder: 3,
    },
    {
      name: "Indoor Air Quality",
      slug: "indoor-air-quality",
      description:
        "Breathe easier with our indoor air quality solutions. We install and service air purifiers, humidifiers, dehumidifiers, UV germicidal lights, and advanced filtration systems. We can also perform duct cleaning and sealing to reduce allergens and improve airflow.",
      shortDescription: "Solutions for cleaner, healthier indoor air.",
      icon: "Wind",
      priceDisplay: "Call for pricing",
      isBookable: true,
      estimatedDuration: 150,
      sortOrder: 4,
    },
    {
      name: "Emergency Service",
      slug: "emergency-service",
      description:
        "HVAC emergencies don't wait, and neither do we. Our emergency service team is available for urgent heating and cooling failures. We prioritize safety and comfort to get your system back online as quickly as possible.",
      shortDescription: "24/7 emergency HVAC service when you need it most.",
      icon: "AlertTriangle",
      priceDisplay: "Call now",
      isBookable: true,
      estimatedDuration: 180,
      sortOrder: 5,
    },
  ];

  const serviceIds: string[] = [];
  for (const s of servicesData) {
    const [row] = await db
      .insert(schema.serviceCatalog)
      .values({ tenantId: TENANT_ID, ...s })
      .returning({ id: schema.serviceCatalog.id });
    serviceIds.push(row.id);
  }
  console.log(`  Created ${servicesData.length} services`);

  // --- Website: Pages & Sections ---
  console.log("\nCreating website pages...");

  async function createPage(
    page: {
      slug: string;
      title: string;
      isHomepage?: boolean;
      sortOrder: number;
      navLabel?: string;
      seo?: { title: string; description: string };
    },
    sections: {
      type: string;
      content: unknown;
      sortOrder: number;
    }[]
  ): Promise<string> {
    const [row] = await db
      .insert(schema.sitePages)
      .values({
        tenantId: TENANT_ID,
        slug: page.slug,
        title: page.title,
        status: "published",
        isHomepage: page.isHomepage ?? false,
        sortOrder: page.sortOrder,
        showInNav: true,
        navLabel: page.navLabel ?? page.title,
        publishedAt: now,
        seo: page.seo as any,
      })
      .returning({ id: schema.sitePages.id });

    for (const s of sections) {
      await db.insert(schema.siteSections).values({
        tenantId: TENANT_ID,
        pageId: row.id,
        type: s.type as any,
        content: s.content as any,
        sortOrder: s.sortOrder,
        isVisible: true,
      });
    }

    return row.id;
  }

  // Homepage
  await createPage(
    {
      slug: "/",
      title: "Home",
      isHomepage: true,
      sortOrder: 0,
      navLabel: "Home",
      seo: {
        title: `${TENANT_NAME} - Professional Heating & Cooling Services`,
        description: `${TENANT_NAME} provides expert HVAC repair, installation, and maintenance. Trusted by homeowners and businesses. Call today for fast, reliable service.`,
      },
    },
    [
      {
        type: "hero",
        sortOrder: 0,
        content: {
          heading: "Your Comfort Is Our Priority",
          subheading:
            "Professional heating, cooling, and indoor air quality services for homes and businesses. Licensed, insured, and committed to your satisfaction.",
          ctaText: "Book a Service",
          ctaLink: "/contact",
          alignment: "center",
        },
      },
      {
        type: "services",
        sortOrder: 1,
        content: {
          heading: "Our Services",
          description:
            "From routine maintenance to emergency repairs, we have you covered.",
          showPricing: true,
          maxItems: 6,
          layout: "grid",
        },
      },
      {
        type: "testimonials",
        sortOrder: 2,
        content: {
          heading: "What Our Customers Say",
          items: [
            {
              name: "Robert A.",
              text: "They came out the same day and had my AC running perfectly within an hour. Professional, fair pricing, and great communication the whole time.",
              rating: 5,
            },
            {
              name: "Susan C.",
              text: "We've used them for years for our medical office HVAC. They understand the urgency and always deliver. Can't recommend them enough.",
              rating: 5,
            },
            {
              name: "Patricia M.",
              text: "Our heat pump stopped working on the coldest night of the year. They were there first thing in the morning and had it fixed by lunch. Lifesavers!",
              rating: 5,
            },
            {
              name: "James T.",
              text: "Great experience from start to finish. The technician explained everything clearly, showed me the issue, and gave me options. No pressure, no upsells.",
              rating: 5,
            },
          ],
        },
      },
      {
        type: "cta_banner",
        sortOrder: 3,
        content: {
          heading: "Ready to Get Started?",
          subheading:
            "Schedule your service today and experience the difference.",
          ctaText: "Contact Us",
          ctaLink: "/contact",
        },
      },
      {
        type: "contact_form",
        sortOrder: 4,
        content: {
          heading: "Request Service",
          description:
            "Fill out the form below and we'll get back to you within one business day.",
          showMap: false,
          showPhone: true,
          showEmail: true,
        },
      },
    ]
  );
  console.log("  Home page (5 sections)");

  // About page
  await createPage(
    {
      slug: "about",
      title: "About Us",
      sortOrder: 1,
      navLabel: "About",
      seo: {
        title: `About ${TENANT_NAME}`,
        description: `Learn about ${TENANT_NAME} - our story, our team, and our commitment to quality service.`,
      },
    },
    [
      {
        type: "about",
        sortOrder: 0,
        content: {
          heading: `About ${TENANT_NAME}`,
          content: `Founded with a commitment to honest, reliable service, ${TENANT_NAME} has grown into a trusted partner for homeowners and businesses throughout the area. Our team of licensed, certified technicians brings years of hands-on experience to every job — whether it's a routine tune-up or an emergency repair.\n\nWe believe in doing things right the first time. That means thorough diagnostics, transparent pricing, and quality workmanship backed by real warranties. We treat your home or business the way we'd treat our own, because our reputation depends on your satisfaction.\n\nOur mission is simple: deliver professional service that you can count on, today and for years to come.`,
          layout: "center",
        },
      },
      {
        type: "team",
        sortOrder: 1,
        content: {
          heading: "Meet Our Team",
          members: [
            {
              name: `${ADMIN_FIRST_NAME} ${ADMIN_LAST_NAME}`,
              role: "Owner / General Manager",
              bio: "Oversees all operations and ensures every customer receives top-quality service.",
            },
            {
              name: "Mike Johnson",
              role: "Senior Technician",
              bio: "Experienced HVAC technician specializing in system diagnostics and complex repairs.",
            },
            {
              name: "Sarah Williams",
              role: "Lead Technician",
              bio: "Expert in heat pump systems and energy-efficient installations.",
            },
            {
              name: "Carlos Rodriguez",
              role: "Service Technician",
              bio: "Specializes in commercial HVAC systems and refrigeration equipment.",
            },
            {
              name: "Jenny Clark",
              role: "Office Manager",
              bio: "Keeps operations running smoothly and ensures a great customer experience from first call to completion.",
            },
            {
              name: "Dave Thompson",
              role: "Dispatcher",
              bio: "Coordinates scheduling and dispatching to get technicians to you as quickly as possible.",
            },
          ],
        },
      },
      {
        type: "cta_banner",
        sortOrder: 2,
        content: {
          heading: "Join Our Growing List of Happy Customers",
          subheading:
            "Experience professional service that puts your comfort first.",
          ctaText: "Schedule Service",
          ctaLink: "/contact",
        },
      },
    ]
  );
  console.log("  About page (3 sections)");

  // Services page
  await createPage(
    {
      slug: "services",
      title: "Services",
      sortOrder: 2,
      navLabel: "Services",
      seo: {
        title: `Services - ${TENANT_NAME}`,
        description: `Explore our full range of HVAC services including repair, installation, maintenance, and emergency service.`,
      },
    },
    [
      {
        type: "hero",
        sortOrder: 0,
        content: {
          heading: "Our Services",
          subheading:
            "Comprehensive heating, cooling, and air quality solutions for residential and commercial properties.",
          alignment: "center",
        },
      },
      {
        type: "services",
        sortOrder: 1,
        content: {
          heading: "What We Offer",
          description:
            "Every service is performed by licensed, insured technicians and backed by our satisfaction guarantee.",
          showPricing: true,
          maxItems: 6,
          layout: "grid",
        },
      },
      {
        type: "faq",
        sortOrder: 2,
        content: {
          heading: "Frequently Asked Questions",
          items: [
            {
              question: "How often should I service my HVAC system?",
              answer:
                "We recommend professional maintenance at least twice a year — once in spring for cooling and once in fall for heating. Regular tune-ups improve efficiency, extend equipment life, and help prevent unexpected breakdowns.",
            },
            {
              question: "Do you offer free estimates for new installations?",
              answer:
                "Yes. We provide free in-home estimates for all equipment replacements and new installations. A comfort advisor will assess your needs, review options with you, and provide transparent pricing with no obligation.",
            },
            {
              question: "What brands do you service?",
              answer:
                "We service all major brands including Carrier, Trane, Lennox, Goodman, Rheem, Mitsubishi, Daikin, and more. Our trucks are stocked with common parts to minimize return trips.",
            },
            {
              question: "How quickly can you respond to an emergency?",
              answer:
                "We prioritize emergency calls and strive to respond within a few hours during business hours. After-hours emergency service is available — call our main number and follow the prompts for urgent service.",
            },
            {
              question: "Do you work on commercial systems?",
              answer:
                "Yes. We service commercial rooftop units, split systems, refrigeration equipment, and more. We work with property managers, restaurant owners, medical offices, and other commercial clients.",
            },
            {
              question: "What payment methods do you accept?",
              answer:
                "We accept all major credit cards, checks, and cash. For larger projects like system replacements, we also offer financing options. Ask our office team for details.",
            },
          ],
        },
      },
      {
        type: "cta_banner",
        sortOrder: 3,
        content: {
          heading: "Need Service?",
          subheading:
            "Contact us today to schedule an appointment or request an estimate.",
          ctaText: "Get in Touch",
          ctaLink: "/contact",
        },
      },
    ]
  );
  console.log("  Services page (4 sections)");

  // Contact page
  await createPage(
    {
      slug: "contact",
      title: "Contact Us",
      sortOrder: 3,
      navLabel: "Contact",
      seo: {
        title: `Contact ${TENANT_NAME}`,
        description: `Get in touch with ${TENANT_NAME}. Request service, schedule an appointment, or ask a question.`,
      },
    },
    [
      {
        type: "contact_form",
        sortOrder: 0,
        content: {
          heading: "Get in Touch",
          description:
            "Have a question or ready to schedule service? Fill out the form and we'll respond within one business day.",
          showMap: true,
          showPhone: true,
          showEmail: true,
        },
      },
      {
        type: "map",
        sortOrder: 1,
        content: {
          heading: "Our Service Area",
          address: "Springfield, IL",
          showDirectionsLink: true,
        },
      },
    ]
  );
  console.log("  Contact page (2 sections)");

  // --- Website: Booking Requests ---
  console.log("\nCreating sample booking requests...");

  await db.insert(schema.bookingRequests).values([
    {
      tenantId: TENANT_ID,
      serviceId: serviceIds[0], // AC Repair
      status: "pending",
      firstName: "Angela",
      lastName: "Perry",
      email: "angela.perry@mailbox.net",
      phone: "(555) 310-8821",
      addressLine1: "78 Sunset Drive",
      city: "Springfield",
      state: "IL",
      zip: "62702",
      preferredDate: daysFromNow(3).toISOString().split("T")[0],
      preferredTimeSlot: "morning",
      message:
        "AC is blowing warm air. Started yesterday. Unit is about 8 years old.",
    },
    {
      tenantId: TENANT_ID,
      serviceId: serviceIds[3], // Maintenance & Tune-Up
      status: "pending",
      firstName: "Derek",
      lastName: "Nguyen",
      email: "derek.nguyen@inbox.org",
      phone: "(555) 310-8822",
      addressLine1: "340 Riverside Blvd",
      city: "Springfield",
      state: "IL",
      zip: "62703",
      preferredDate: daysFromNow(5).toISOString().split("T")[0],
      preferredTimeSlot: "afternoon",
      message:
        "Would like to schedule a spring tune-up for my central AC before it gets hot.",
    },
    {
      tenantId: TENANT_ID,
      serviceId: serviceIds[5], // Emergency Service
      status: "confirmed",
      firstName: "Rachel",
      lastName: "Foster",
      email: "rachel.foster@fastmail.com",
      phone: "(555) 310-8823",
      addressLine1: "15 Oak Hill Court",
      city: "Springfield",
      state: "IL",
      zip: "62701",
      preferredDate: daysFromNow(1).toISOString().split("T")[0],
      preferredTimeSlot: "morning",
      message:
        "Furnace making a loud banging noise and shutting off. House is getting cold fast.",
    },
  ]);
  console.log("  Created 3 booking requests (2 pending, 1 confirmed)");

  // --- Summary ---
  console.log("\n\u2705 Production seed complete!\n");
  console.log("Summary:");
  console.log(`  Tenant:    ${TENANT_NAME} (${TENANT_SLUG})`);
  console.log("  - 6 users (1 admin, 1 office manager, 1 dispatcher, 3 technicians)");
  console.log("  - 12 customers (8 residential, 4 commercial)");
  console.log("  - 14 properties");
  console.log("  - 10 equipment records");
  console.log("  - 11 jobs (3 completed, 1 in-progress, 2 dispatched, 2 scheduled, 3 new)");
  console.log("  - 3 estimates (1 sent, 1 approved, 1 draft)");
  console.log("  - 2 invoices (1 paid, 1 sent)");
  console.log("  - 1 website (4 pages, 14 sections, 6 services, 3 booking requests)");
  console.log(`\nAdmin login: ${ADMIN_EMAIL}`);
  console.log(`Staff emails use @${emailDomain} domain`);
  console.log(`Website: http://localhost:3201/${TENANT_SLUG}`);

  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
