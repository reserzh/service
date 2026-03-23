# AI Assistant Chatbot — Implementation Plan

## Context

Users need a way to ask natural-language questions about their business data (customers, jobs, invoices, estimates, reports, etc.) without navigating through multiple pages. The AI Assistant will be a full-page chat experience backed by Claude API, with persisted conversation history, streaming responses, and the ability to generate visual reports (inline charts, PDF, Excel exports). This is a read-only feature — the AI can query data but cannot modify it. Access is restricted to admin and office_manager roles.

---

## Architecture Overview

```
User  →  Chat UI  →  SSE Stream  →  POST /api/v1/ai/chat
                                          │
                                     Claude API (Sonnet 4.6)
                                          │ tool_use
                                     Tool Executor
                                          │
                                     Existing Service Layer
                                     (tenant-isolated, RBAC)
```

Claude receives tool definitions that map to existing read-only service functions. When Claude needs data, it calls a tool, the server executes it through the existing service layer (which enforces tenant isolation and permissions), and returns the result. The response streams back to the client via SSE.

---

## Phase 1: Foundation (Schema + Claude Client + Tools)

### 1.1 Install dependencies

```bash
pnpm add @anthropic-ai/sdk recharts jspdf jspdf-autotable xlsx --filter back
```

### 1.2 Environment variable

- Add `ANTHROPIC_API_KEY` to `turbo.json` build env array
- Add to `apps/back/src/lib/env.ts` as optional (graceful degradation if missing)
- Add to `.env.local` in `apps/back/`

### 1.3 Database schema

**New file:** `packages/shared/src/db/schema/ai.ts`

```typescript
// ai_conversations table
{
  id: uuid PK defaultRandom,
  tenantId: uuid FK → tenants.id (cascade),
  userId: uuid FK → users.id (cascade),
  title: varchar(255) not null,
  createdAt: timestamp with tz defaultNow,
  updatedAt: timestamp with tz defaultNow,
}
// Indexes: (tenantId, userId), (tenantId, updatedAt)

// ai_messages table
{
  id: uuid PK defaultRandom,
  conversationId: uuid FK → ai_conversations.id (cascade),
  tenantId: uuid FK → tenants.id (cascade),
  role: varchar(20) not null,  // 'user' | 'assistant'
  content: text not null,
  metadata: jsonb,  // chart data, table data, tool calls
  createdAt: timestamp with tz defaultNow,
}
// Indexes: (conversationId), (tenantId)
```

- Add Drizzle relations
- Export from `packages/shared/src/db/schema/index.ts`
- Run `pnpm db:push` from `apps/back/`

**Metadata JSONB type:**

```typescript
type AIMessageMetadata = {
  toolCalls?: Array<{ name: string; input: Record<string, unknown>; result?: unknown }>;
  chartData?: {
    type: "bar" | "line" | "pie" | "area";
    data: Record<string, unknown>[];
    xKey: string;
    yKeys: string[];
    title?: string;
  };
  tableData?: {
    columns: Array<{ key: string; header: string }>;
    rows: Record<string, unknown>[];
    title?: string;
  };
};
```

### 1.4 RBAC permission

**Modify:** `apps/back/src/lib/auth/permissions.ts`

- Add `"ai_assistant"` to the `Resource` union type
- Add `ai_assistant: ["read"]` to `admin` and `office_manager` role entries
- No other roles get access

### 1.5 Claude API client

**New file:** `apps/back/src/lib/ai/client.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | undefined;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is required for AI features");
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export const AI_MODEL = "claude-sonnet-4-20250514";
export const MAX_TOKENS = 4096;
```

### 1.6 System prompt

**New file:** `apps/back/src/lib/ai/system-prompt.ts`

- Builds prompt with user name/role context from `UserContext`
- Describes the business domain (field service management for HVAC/plumbing/electrical)
- Lists available data types and what the AI can query
- Instructs Claude on formatting:
  - Use markdown tables for tabular data
  - Use `<chart type="bar" title="..." xKey="..." yKeys="...">JSON_DATA</chart>` markers for visualizations
  - Use `<report-table title="..." columns="Col1,Col2,...">JSON_DATA</report-table>` markers for exportable tables
  - Format currency as `$X,XXX.XX`, dates as human-readable
- States clearly: read-only access, cannot create/update/delete

### 1.7 Tool definitions

**New file:** `apps/back/src/lib/ai/tools.ts`

16 tools mapping to existing service functions:

| Tool | Wraps Service Function | Description |
|------|----------------------|-------------|
| `search_customers` | `listCustomers()` | Search by name/email/phone, filter by type |
| `get_customer` | `getCustomer()` | Full detail with properties, equipment, job history |
| `search_jobs` | `listJobs()` | Filter by status, priority, date range, assignee |
| `get_job` | `getJob()` | Job detail with line items, notes, assignments |
| `search_invoices` | `listInvoices()` | Filter by status, date range, customer |
| `get_invoice` | `getInvoice()` | Invoice detail with line items, payments |
| `search_estimates` | `listEstimates()` | Filter by status, customer |
| `get_estimate` | `getEstimate()` | Estimate with options and items |
| `search_agreements` | `listAgreements()` | Filter by status |
| `get_dashboard_stats` | `getDashboardStats()` | Today's KPIs (jobs, revenue MTD, open estimates, overdue) |
| `get_revenue_report` | `getRevenueReport()` | Revenue by period + payment method breakdown |
| `get_jobs_report` | `getJobsReport()` | Job metrics by status, type, daily counts |
| `get_invoice_report` | `getInvoiceReport()` | AR aging buckets, status breakdown |
| `get_technician_report` | `getTechnicianReport()` | Per-technician performance metrics |
| `get_team_members` | `listTeamMembers()` | Active staff with roles |
| `get_pricebook_items` | `listPricebookItems()` | Catalog search by category/term |

Each tool definition follows the Anthropic tool use JSON schema spec with `name`, `description`, and `input_schema`.

### 1.8 Tool executor

**New file:** `apps/back/src/lib/ai/tool-executor.ts`

- Switch/case dispatcher: receives tool name + input + `UserContext`, calls corresponding service
- Caps `pageSize` at 10-25 per tool call (keeps context manageable, AI can paginate)
- Wraps errors gracefully — returns error text as tool_result so Claude can explain to user
- Every service call inherits tenant isolation via `ctx.tenantId`

---

## Phase 2: API Routes

### 2.1 AI conversation service

**New file:** `apps/back/src/lib/services/ai.ts`

Functions (follow existing service layer pattern):

| Function | Purpose |
|----------|---------|
| `listConversations(ctx, { page, pageSize })` | User's conversations, ordered by `updatedAt` desc |
| `getConversation(ctx, id)` | Conversation with all messages |
| `createConversation(ctx, title)` | New conversation |
| `updateConversationTitle(ctx, id, title)` | Rename |
| `deleteConversation(ctx, id)` | Hard delete (cascades messages) |
| `addMessage(ctx, conversationId, role, content, metadata?)` | Insert message + bump conversation `updatedAt` |
| `getConversationMessages(ctx, conversationId, limit?)` | Messages for Claude context (default last 50) |

All enforce `assertPermission(ctx, "ai_assistant", "read")` and scope by `tenantId`.

### 2.2 Streaming chat endpoint

**New file:** `apps/back/src/app/api/v1/ai/chat/route.ts`

`POST /api/v1/ai/chat`

Request body: `{ message: string, conversationId?: string }`

Flow:
1. Auth via `requireApiAuth(req)`
2. Permission check: `assertPermission(ctx, "ai_assistant", "read")`
3. Rate limit: 20 req/min per user via `checkRateLimit("ai:" + ctx.userId, { maxRequests: 20, windowMs: 60_000 })`
4. Validate input with Zod (message: string min 1 max 2000, conversationId: uuid optional)
5. Create conversation if none provided (title = first 100 chars of message)
6. Save user message to DB
7. Load conversation history (last 50 messages)
8. Build Anthropic messages array from history
9. Create SSE `ReadableStream`:
   - Call `client.messages.create()` with streaming
   - Process stream events, emit `text_delta` SSE events
   - On `tool_use` stop reason: execute tool via `executeTool()`, emit `tool_use`/`tool_result` events, append tool result, call Claude again
   - Max 5 tool call iterations per request
   - On completion: save assistant message + metadata to DB, emit `[DONE]`
   - On error: emit error event, close stream
10. Return `Response` with SSE headers + `X-Conversation-Id` header

SSE event format:
```
data: {"type":"text_delta","text":"Hello"}
data: {"type":"tool_use","name":"search_customers","input":{...}}
data: {"type":"tool_result","name":"search_customers","data":{...}}
data: [DONE]
```

### 2.3 Conversation CRUD routes

**New file:** `apps/back/src/app/api/v1/ai/conversations/route.ts`
- `GET` — list user's conversations (paginated)

**New file:** `apps/back/src/app/api/v1/ai/conversations/[id]/route.ts`
- `GET` — get conversation with messages
- `PATCH` — rename (`{ title: string }`)
- `DELETE` — delete conversation

All follow existing API route patterns (try/catch, `handleApiError`, JSON response format).

---

## Phase 3: Chat UI

### 3.1 Sidebar navigation

**Modify 3 files:**
- `apps/back/src/components/layout/app-sidebar.tsx` — add `{ title: "AI Assistant", href: "/ai-assistant", icon: Bot }` after Agreements in `mainNav`
- `apps/back/src/components/layout/blueprint-top-nav.tsx` — same entry
- `apps/back/src/components/layout/glass-top-nav.tsx` — same entry

Icon: `Bot` from `lucide-react`

### 3.2 Page files

All under `apps/back/src/app/(dashboard)/ai-assistant/`:

**`page.tsx`** (Server Component)
- `await requireAuth()` for auth context
- Check `hasPermission(ctx.role, "ai_assistant", "read")`, redirect to `/dashboard` if denied
- Render `<AIAssistantView user={ctx} />`

**`loading.tsx`** (Server Component)
- Skeleton matching the two-panel layout

### 3.3 Main view component

**`ai-assistant-view.tsx`** (Client Component)

Two-panel layout:
```
Desktop (>=1024px):
+-------------------+----------------------------------+
| Conversations     |  Chat Area                       |
| [+ New Chat]      |  [Messages with streaming text,  |
| - Conv 1          |   charts, tables, downloads]     |
| - Conv 2          |                                  |
|                   |  [Auto-resizing input bar]       |
+-------------------+----------------------------------+

Mobile (<1024px):
Sheet/drawer for conversation list, full-width chat area
```

State management: `useState` for `activeConversationId`, `messages[]`, `conversations[]`

### 3.4 Sub-components

**`conversation-sidebar.tsx`** — Conversation list
- Fetches from `GET /api/v1/ai/conversations`
- List items: title + relative timestamp (`date-fns formatDistanceToNow`)
- Click to load conversation messages
- "..." menu (DropdownMenu) with Rename and Delete
- "New Chat" button at top
- ScrollArea for long lists

**`chat-area.tsx`** — Message display
- Renders message list with `MessageBubble` components
- Auto-scrolls to bottom on new messages
- Shows tool activity indicators during streaming ("Searching customers...")
- Empty state: `SuggestedPrompts` component
- Uses `useRef` for scroll container

**`message-bubble.tsx`** — Individual message
- User messages: right-aligned, primary background
- Assistant messages: left-aligned, muted background
- Parses markdown (bold, italic, code blocks, lists, tables) via lightweight regex
- Extracts `<chart>` blocks → renders `ChartRenderer`
- Extracts `<report-table>` blocks → renders table + `ReportDownload` buttons
- Copy button on assistant messages

**`chat-input.tsx`** — Input area
- Auto-resizing `<textarea>` (grows up to ~5 lines)
- Send button (Send icon)
- Enter to send, Shift+Enter for newline
- Disabled while streaming
- Max 2000 character input

**`use-chat-stream.ts`** — Custom hook
- `sendMessage(text, conversationId?)` — opens `fetch` with SSE, parses events
- Returns `{ sendMessage, cancel, isStreaming, streamedText, toolEvents, conversationId }`
- Uses `AbortController` for cancellation
- Accumulates text deltas, tracks tool call events

**`suggested-prompts.tsx`** — Starter prompts
- Grid of clickable cards:
  - "Show me today's dashboard overview"
  - "What are my overdue invoices?"
  - "Revenue report for this month"
  - "Which technician completed the most jobs last month?"
  - "Show me all jobs scheduled for this week"
  - "List my top 10 customers by revenue"

---

## Phase 4: Reports & Charts

### 4.1 Chart renderer

**New file:** `apps/back/src/app/(dashboard)/ai-assistant/chart-renderer.tsx`

- Dynamically imported (`next/dynamic` with `ssr: false`) to avoid bundle bloat (~400KB)
- Renders Recharts components based on `chartData.type`:
  - `bar` → `<BarChart>` with `<Bar>` per yKey
  - `line` → `<LineChart>` with `<Line>` per yKey
  - `pie` → `<PieChart>` with `<Pie>` + `<Cell>` colors
  - `area` → `<AreaChart>` with `<Area>` per yKey
- All wrapped in `<ResponsiveContainer width="100%" height={300}>`
- Uses theme-aware color palette
- Includes title, axis labels, tooltip, legend

### 4.2 PDF export

**New file:** `apps/back/src/app/(dashboard)/ai-assistant/export-pdf.ts`

```typescript
export function exportTableToPdf(
  title: string,
  columns: Array<{ key: string; header: string }>,
  rows: Record<string, unknown>[]
): void
```

- Client-side generation with `jspdf` + `jspdf-autotable`
- Adds title header, generation timestamp
- Auto-formats table with column widths
- Downloads as `{title}-{timestamp}.pdf`

### 4.3 Excel export

**New file:** `apps/back/src/app/(dashboard)/ai-assistant/export-excel.ts`

```typescript
export function exportTableToExcel(
  title: string,
  columns: Array<{ key: string; header: string }>,
  rows: Record<string, unknown>[]
): void
```

- Client-side generation with `xlsx` (SheetJS)
- Maps column headers, creates worksheet + workbook
- Downloads as `{title}-{timestamp}.xlsx`

### 4.4 Report download component

**New file:** `apps/back/src/app/(dashboard)/ai-assistant/report-download.tsx`

- Renders "Download PDF" and "Download Excel" buttons (lucide `FileDown` and `Sheet` icons)
- Receives `tableData` props (title, columns, rows)
- Calls `exportTableToPdf` / `exportTableToExcel` on click

---

## Phase 5: Polish

### 5.1 Guardrails

| Guard | Value | Purpose |
|-------|-------|---------|
| Rate limit | 20 req/min/user | Cost control |
| Max message length | 2000 chars | Input size limit |
| Max history to Claude | 50 messages | Context window management |
| Max tool calls/request | 5 | Prevent runaway loops |
| Tool result truncation | 4KB | Keep Claude context manageable |
| Page size for tools | 10-25 rows | Limit data volume |

### 5.2 Error handling

- **Missing API key**: Show "AI Assistant is not yet configured" page instead of chat UI
- **Stream errors**: Show error message in chat with "Retry" button
- **Tool execution errors**: Return error as tool_result text → Claude explains gracefully
- **Rate limit exceeded**: Show toast "Too many requests, please wait"
- **Network disconnect**: Detect via SSE error, show reconnect prompt

### 5.3 Empty & loading states

- **No conversations**: Welcome screen with Bot icon + description + `SuggestedPrompts`
- **Streaming**: Pulsing cursor after last text, tool indicators ("Searching invoices...")
- **Loading conversations**: Skeleton list items in sidebar
- **Loading messages**: Skeleton bubbles in chat area

### 5.4 Conversation titles

- Auto-set to first 100 chars of user's first message
- Editable via rename action in conversation sidebar

---

## Files Summary

### Modified (7 files)

| File | Change |
|------|--------|
| `packages/shared/src/db/schema/index.ts` | Add `export * from "./ai"` |
| `apps/back/src/lib/auth/permissions.ts` | Add `ai_assistant` resource for admin + office_manager |
| `apps/back/src/lib/env.ts` | Add optional `ANTHROPIC_API_KEY` |
| `apps/back/src/components/layout/app-sidebar.tsx` | Add AI Assistant nav entry |
| `apps/back/src/components/layout/blueprint-top-nav.tsx` | Add AI Assistant nav entry |
| `apps/back/src/components/layout/glass-top-nav.tsx` | Add AI Assistant nav entry |
| `turbo.json` | Add `ANTHROPIC_API_KEY` to build env |

### New (22 files)

```
packages/shared/src/db/schema/ai.ts                              # DB schema
apps/back/src/lib/ai/client.ts                                   # Anthropic client
apps/back/src/lib/ai/system-prompt.ts                            # System prompt builder
apps/back/src/lib/ai/tools.ts                                    # Tool definitions (16 tools)
apps/back/src/lib/ai/tool-executor.ts                            # Tool dispatcher
apps/back/src/lib/services/ai.ts                                 # Conversation CRUD service
apps/back/src/app/api/v1/ai/chat/route.ts                        # Streaming chat endpoint
apps/back/src/app/api/v1/ai/conversations/route.ts               # List/create conversations
apps/back/src/app/api/v1/ai/conversations/[id]/route.ts          # Get/rename/delete conversation
apps/back/src/app/(dashboard)/ai-assistant/page.tsx              # Server page
apps/back/src/app/(dashboard)/ai-assistant/loading.tsx           # Loading skeleton
apps/back/src/app/(dashboard)/ai-assistant/ai-assistant-view.tsx # Main client orchestrator
apps/back/src/app/(dashboard)/ai-assistant/conversation-sidebar.tsx
apps/back/src/app/(dashboard)/ai-assistant/chat-area.tsx
apps/back/src/app/(dashboard)/ai-assistant/message-bubble.tsx
apps/back/src/app/(dashboard)/ai-assistant/chat-input.tsx
apps/back/src/app/(dashboard)/ai-assistant/use-chat-stream.ts   # SSE streaming hook
apps/back/src/app/(dashboard)/ai-assistant/suggested-prompts.tsx
apps/back/src/app/(dashboard)/ai-assistant/chart-renderer.tsx    # Recharts wrapper
apps/back/src/app/(dashboard)/ai-assistant/export-pdf.ts         # jsPDF export
apps/back/src/app/(dashboard)/ai-assistant/export-excel.ts       # SheetJS export
apps/back/src/app/(dashboard)/ai-assistant/report-download.tsx   # Download buttons
```

---

## Verification Checklist

1. `pnpm typecheck` passes with no errors
2. Navigate to `/ai-assistant` — page loads with welcome screen
3. "How many customers do I have?" → Claude queries and responds with count
4. "Show me revenue for last month" → inline bar chart renders + PDF/Excel download buttons
5. "What are my overdue invoices?" → formatted markdown table with data
6. Reload page → conversation history persists and loads correctly
7. Login as technician → redirected away from `/ai-assistant`
8. Send >20 messages in 1 minute → 429 rate limit response
9. Test on mobile viewport → responsive layout with drawer for conversations
10. Test with missing `ANTHROPIC_API_KEY` → shows "not configured" message
