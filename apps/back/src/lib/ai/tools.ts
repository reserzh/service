import type Anthropic from "@anthropic-ai/sdk";

export const AI_TOOLS: Anthropic.Tool[] = [
  // ==================== Customers ====================
  {
    name: "search_customers",
    description:
      "Search for customers by name, email, or phone. Returns a paginated list.",
    input_schema: {
      type: "object" as const,
      properties: {
        search: {
          type: "string",
          description: "Search query (name, email, or phone)",
        },
        type: {
          type: "string",
          enum: ["residential", "commercial"],
          description: "Filter by customer type",
        },
        page: { type: "number", description: "Page number (default 1)" },
      },
      required: [],
    },
  },
  {
    name: "get_customer",
    description:
      "Get full details for a specific customer including their properties and equipment.",
    input_schema: {
      type: "object" as const,
      properties: {
        customer_id: {
          type: "string",
          description: "The customer UUID",
        },
      },
      required: ["customer_id"],
    },
  },

  // ==================== Jobs ====================
  {
    name: "search_jobs",
    description:
      "Search for jobs/service calls. Can filter by status, priority, date range, and assignee.",
    input_schema: {
      type: "object" as const,
      properties: {
        search: {
          type: "string",
          description: "Search query (job number, summary, customer name)",
        },
        status: {
          type: "string",
          enum: [
            "new",
            "scheduled",
            "dispatched",
            "in_progress",
            "completed",
            "canceled",
          ],
          description: "Filter by job status",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "emergency"],
          description: "Filter by priority",
        },
        assigned_to: {
          type: "string",
          description: "Filter by assigned technician UUID",
        },
        from: {
          type: "string",
          description: "Start date filter (YYYY-MM-DD)",
        },
        to: {
          type: "string",
          description: "End date filter (YYYY-MM-DD)",
        },
        page: { type: "number", description: "Page number (default 1)" },
      },
      required: [],
    },
  },
  {
    name: "get_job",
    description:
      "Get full details for a specific job including line items and notes.",
    input_schema: {
      type: "object" as const,
      properties: {
        job_id: { type: "string", description: "The job UUID" },
      },
      required: ["job_id"],
    },
  },

  // ==================== Invoices ====================
  {
    name: "search_invoices",
    description:
      "Search for invoices. Can filter by status, date range, and customer.",
    input_schema: {
      type: "object" as const,
      properties: {
        search: {
          type: "string",
          description: "Search query (invoice number, customer name)",
        },
        status: {
          type: "string",
          enum: ["draft", "sent", "viewed", "partial", "paid", "void", "overdue"],
          description: "Filter by invoice status",
        },
        customer_id: {
          type: "string",
          description: "Filter by customer UUID",
        },
        from: {
          type: "string",
          description: "Start date filter (YYYY-MM-DD)",
        },
        to: {
          type: "string",
          description: "End date filter (YYYY-MM-DD)",
        },
        page: { type: "number", description: "Page number (default 1)" },
      },
      required: [],
    },
  },
  {
    name: "get_invoice",
    description:
      "Get full details for a specific invoice including line items and payments.",
    input_schema: {
      type: "object" as const,
      properties: {
        invoice_id: { type: "string", description: "The invoice UUID" },
      },
      required: ["invoice_id"],
    },
  },

  // ==================== Estimates ====================
  {
    name: "search_estimates",
    description:
      "Search for estimates/proposals. Can filter by status and customer.",
    input_schema: {
      type: "object" as const,
      properties: {
        search: {
          type: "string",
          description: "Search query (estimate number, customer name)",
        },
        status: {
          type: "string",
          enum: ["draft", "sent", "viewed", "approved", "declined", "expired"],
          description: "Filter by estimate status",
        },
        customer_id: {
          type: "string",
          description: "Filter by customer UUID",
        },
        page: { type: "number", description: "Page number (default 1)" },
      },
      required: [],
    },
  },
  {
    name: "get_estimate",
    description:
      "Get full details for a specific estimate including options and line items.",
    input_schema: {
      type: "object" as const,
      properties: {
        estimate_id: { type: "string", description: "The estimate UUID" },
      },
      required: ["estimate_id"],
    },
  },

  // ==================== Agreements ====================
  {
    name: "search_agreements",
    description:
      "Search for service agreements/contracts. Can filter by status.",
    input_schema: {
      type: "object" as const,
      properties: {
        search: {
          type: "string",
          description: "Search query (agreement name, customer name)",
        },
        status: {
          type: "string",
          enum: ["draft", "active", "paused", "completed", "canceled"],
          description: "Filter by agreement status",
        },
        page: { type: "number", description: "Page number (default 1)" },
      },
      required: [],
    },
  },

  // ==================== Reports ====================
  {
    name: "get_dashboard_stats",
    description:
      "Get today's dashboard KPIs: today's jobs, completed jobs, MTD revenue, open estimates, overdue invoices.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_revenue_report",
    description:
      "Get revenue report with breakdown by period and payment method.",
    input_schema: {
      type: "object" as const,
      properties: {
        from: {
          type: "string",
          description: "Start date (YYYY-MM-DD)",
        },
        to: {
          type: "string",
          description: "End date (YYYY-MM-DD)",
        },
        group_by: {
          type: "string",
          enum: ["day", "week", "month"],
          description: "Group revenue by period (default: day)",
        },
      },
      required: ["from", "to"],
    },
  },
  {
    name: "get_jobs_report",
    description:
      "Get jobs report with breakdown by status, type, and daily counts.",
    input_schema: {
      type: "object" as const,
      properties: {
        from: {
          type: "string",
          description: "Start date (YYYY-MM-DD)",
        },
        to: {
          type: "string",
          description: "End date (YYYY-MM-DD)",
        },
      },
      required: ["from", "to"],
    },
  },
  {
    name: "get_invoice_report",
    description:
      "Get invoice/AR report with status breakdown and aging buckets.",
    input_schema: {
      type: "object" as const,
      properties: {
        from: {
          type: "string",
          description: "Start date (YYYY-MM-DD)",
        },
        to: {
          type: "string",
          description: "End date (YYYY-MM-DD)",
        },
      },
      required: ["from", "to"],
    },
  },
  {
    name: "get_technician_report",
    description:
      "Get technician performance report: jobs completed, revenue generated per tech.",
    input_schema: {
      type: "object" as const,
      properties: {
        from: {
          type: "string",
          description: "Start date (YYYY-MM-DD)",
        },
        to: {
          type: "string",
          description: "End date (YYYY-MM-DD)",
        },
      },
      required: ["from", "to"],
    },
  },

  // ==================== Team ====================
  {
    name: "get_team_members",
    description: "Get a list of team members. Can filter by role.",
    input_schema: {
      type: "object" as const,
      properties: {
        search: {
          type: "string",
          description: "Search by name or email",
        },
        role: {
          type: "string",
          enum: ["admin", "office_manager", "dispatcher", "csr", "technician"],
          description: "Filter by role",
        },
      },
      required: [],
    },
  },

  // ==================== Pricebook ====================
  {
    name: "get_pricebook_items",
    description:
      "Search the pricebook catalog for services, materials, and labor items.",
    input_schema: {
      type: "object" as const,
      properties: {
        search: {
          type: "string",
          description: "Search by name or description",
        },
        category: {
          type: "string",
          description: "Filter by category",
        },
        type: {
          type: "string",
          enum: ["service", "material", "labor", "equipment"],
          description: "Filter by item type",
        },
      },
      required: [],
    },
  },
];
