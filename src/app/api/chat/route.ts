import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Content } from "@google/generative-ai";
import { GALAXY_STATIC_CONTEXT } from "@/lib/sopContext";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { fetchAuditLogs } from "@/lib/firestore/audit";
import { fetchCallLogs, fetchLeads } from "@/lib/leadsService";
import { normalizeSheetFromFirestore } from "@/lib/firestore/inventory";
import { db } from "@/lib/firebase";

// ── Quotation helpers ─────────────────────────────────────────────────────

const RTDB = "https://galaxy-quotation-default-rtdb.firebaseio.com";

async function fetchAllQuotes(): Promise<any[]> {
  const res = await fetch(`${RTDB}/quotes.json`);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data) return [];
  return Object.values(data) as any[];
}

const QUOTATION_KEYWORDS = [
  "quote", "quotation", "quot", "boq", "bill of quantities",
  "invoice", "estimate", "proposal", "pricing", "rate card",
  "how much", "total amount", "grand total", "pipeline",
  "saved quotes", "recent quotes", "all quotes",
];

function isQuotationRelated(message: string): boolean {
  const lower = message.toLowerCase();
  return QUOTATION_KEYWORDS.some((kw) => lower.includes(kw));
}

function formatQuotesContext(quotes: any[]): string {
  if (!quotes.length) return "No quotations found.";
  const lines = ["Quotations in Galaxy System:\n"];
  const sorted = [...quotes].sort((a, b) =>
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
  for (const q of sorted.slice(0, 20)) {
    lines.push(`Quote #${q.quoteNumber || "?"} — ${q.clientName || "Unknown Client"}`);
    if (q.projectName) lines.push(`  Project: ${q.projectName}`);
    if (q.clientPhone) lines.push(`  Phone: ${q.clientPhone}`);
    if (q.clientAddress) lines.push(`  Address: ${q.clientAddress}`);
    if (q.status) lines.push(`  Status: ${q.status}`);
    if (q.createdAt) lines.push(`  Created: ${new Date(q.createdAt).toLocaleDateString("en-IN")}`);

    // Section discounts
    const sd = q.sectionDiscounts || {};
    if (typeof sd === "object" && Object.keys(sd).length) {
      lines.push(`  Section Discounts: ${Object.entries(sd).map(([k, v]) => `${k}: ${v}%`).join(", ")}`);
    } else if (typeof q.discount === "number") {
      lines.push(`  Discount: ${q.discount}%`);
    }

    // Rooms and products
    if (Array.isArray(q.rooms) && q.rooms.length) {
      for (const room of q.rooms) {
        if (!room) continue;
        lines.push(`  Room/Zone: ${room.name || "Unnamed"}`);
        const products = room.products || room.lineItems || [];
        if (Array.isArray(products) && products.length) {
          for (const item of products) {
            if (!item) continue;
            const qty = item.qty ?? item.quantity ?? 1;
            const unitPrice = item.unitPrice ?? item.price ?? item.gsp ?? 0;
            const name = item.productName ?? item.name ?? "Unknown";
            const category = item.category ?? "";
            lines.push(`    - ${name}${category ? ` [${category}]` : ""} | qty: ${qty} | unit price: ₹${unitPrice} | subtotal: ₹${qty * unitPrice}`);
          }
        }
      }
    }

    // Pricing summary
    if (q.productSubtotal !== undefined) lines.push(`  Product Subtotal (MRP): ₹${q.productSubtotal}`);
    if (q.totalDiscountAmount !== undefined) lines.push(`  Total Discount: ₹${q.totalDiscountAmount}`);
    if (q.totalInstallation !== undefined) lines.push(`  Installation: ₹${q.totalInstallation}`);
    if (q.grandTotal !== undefined) lines.push(`  Grand Total (incl. GST): ₹${q.grandTotal}`);
    lines.push("");
  }
  return lines.join("\n");
}

// ── Query type detection ───────────────────────────────────────────────────

type QueryType =
  | "phone" | "address" | "status" | "manager" | "advance"
  | "deadline" | "workflow" | "contacts" | "all" | "update";

function detectProjectQueryType(message: string): QueryType {
  const lower = message.toLowerCase();

  if (["all details", "full details", "sab kuch", "poori detail"].some((p) => lower.includes(p)))
    return "all";
  // "contacts" before "phone" so "contacts"/"site contact" wins over "contact"
  if (["contacts", "site contact", "electrician", "architect", "interior"].some((p) => lower.includes(p)))
    return "contacts";
  if (["phone", "number", "contact", "mobile"].some((p) => lower.includes(p)))
    return "phone";
  if (["address", "location", "where", "site address"].some((p) => lower.includes(p)))
    return "address";
  if (["status", "progress", "kitna hua"].some((p) => lower.includes(p)))
    return "status";
  if (["site manager", "manager", "who is managing"].some((p) => lower.includes(p)))
    return "manager";
  if (["advance", "payment", "amount", "kitna diya"].some((p) => lower.includes(p)))
    return "advance";
  if (["deadline", "completion", "kab tak"].some((p) => lower.includes(p)))
    return "deadline";
  if (["workflow", "steps", "pending", "completed"].some((p) => lower.includes(p)))
    return "workflow";
  return "update";
}

// ── Formatting helpers ─────────────────────────────────────────────────────

type ProjectData = Record<string, unknown>;
type InventorySheetData = {
  id: string;
  name: string;
  originalUrl: string;
  spreadsheetId: string;
  embedUrl: string;
  createdAt: string;
  createdBy: {
    uid: string;
    displayName: string;
    email: string;
  };
};
type LeadData = {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  city: string;
  address?: string;
  source: string;
  propertyType: string;
  budget?: string;
  assignedTo?: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastCallDate?: string;
  lastCallOutcome?: string;
  nextFollowUpDate?: string;
  nextFollowUpTime?: string;
  priority?: string;
  totalCalls: number;
};
type CallLogData = {
  id: string;
  leadId: string;
  date: string;
  time: string;
  outcome: string;
  notes?: string;
  nextFollowUpDate?: string;
  nextFollowUpTime?: string;
  priority?: string;
  createdAt: string;
};

function clientLabel(data: ProjectData): string {
  return String(data.clientName || data.name || "Unknown");
}

function statusEmoji(s: string): string {
  const map: Record<string, string> = {
    planning: "🔵", in_progress: "🟡", review: "🟠", completed: "🟢", on_hold: "🔴",
  };
  return map[s] ?? "⚪";
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    planning: "Planning", in_progress: "In Progress",
    review: "In Review", completed: "Completed", on_hold: "On Hold",
  };
  return map[s] ?? s;
}

function formatDeadlineStr(data: ProjectData): string {
  if (!data.deadline) return "No deadline set";
  const raw = data.deadline as any;
  const d = raw?.toDate ? raw.toDate() : new Date(String(raw));
  if (isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function formatAmount(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "Not recorded";
  if (typeof value === "number") return `₹${value.toLocaleString("en-IN")}`;
  return String(value);
}

function getAdvanceAmountFromWorkflow(workflow: unknown): number | string | null {
  if (!Array.isArray(workflow)) return null;
  for (const node of workflow) {
    if (!node || typeof node !== "object") continue;
    const n = node as { key?: string; title?: string; amount?: number | string | null; value?: unknown };
    const key = String(n.key ?? "").toLowerCase();
    const title = String(n.title ?? "").toLowerCase();
    if (key !== "advance_received" && !title.includes("advance received")) continue;
    if (n.amount !== undefined && n.amount !== null && n.amount !== "") return n.amount;
    if (typeof n.value === "number" || typeof n.value === "string") return n.value;
  }
  return null;
}

function contactIcon(designation: string): string {
  const d = designation.toLowerCase();
  if (d.includes("architect") || d.includes("interior")) return "🏗️";
  if (d.includes("electrician")) return "⚡";
  if (d.includes("plumber")) return "🔧";
  if (d.includes("manager")) return "👷";
  return "👤";
}

function sheetLabel(data: InventorySheetData): string {
  return String(data.name || "Unnamed sheet");
}

function fmtInventorySheet(data: InventorySheetData): string {
  const lines = [`## ${sheetLabel(data)}`];
  if (data.spreadsheetId) lines.push(`**Spreadsheet ID:** ${String(data.spreadsheetId)}`);
  if (data.originalUrl) lines.push(`**Source URL:** ${String(data.originalUrl)}`);
  if (data.embedUrl) lines.push(`**Embed URL:** ${String(data.embedUrl)}`);
  if (data.createdAt) {
    const createdAt = new Date(String(data.createdAt));
    lines.push(`**Created:** ${isNaN(createdAt.getTime()) ? String(data.createdAt) : createdAt.toLocaleDateString("en-IN")}`);
  }
  const createdBy = data.createdBy;
  if (createdBy?.displayName) lines.push(`**Created By:** ${String(createdBy.displayName)}`);
  else if (createdBy?.email) lines.push(`**Created By:** ${String(createdBy.email)}`);
  return lines.join("\n");
}

function leadLabel(data: LeadData): string {
  return String(data.name || "Unknown lead");
}

function formatDateValue(value?: string): string {
  if (!value) return "Not set";
  const parsed = new Date(String(value));
  return isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString("en-IN");
}

function fmtLeadPhone(data: LeadData): string {
  return [`## ${leadLabel(data)}`, data.phone ? `📞 **Phone:** ${data.phone}` : "_No phone recorded._"].join("\n");
}

function fmtLeadStatus(data: LeadData): string {
  return [
    `## ${leadLabel(data)}`,
    `**Status:** ${String(data.status || "New Lead")}`,
    data.priority ? `**Priority:** ${String(data.priority)}` : null,
    data.totalCalls !== undefined ? `**Total Calls:** ${data.totalCalls}` : null,
  ].filter(Boolean).join("\n");
}

function fmtLeadSource(data: LeadData): string {
  return [`## ${leadLabel(data)}`, `**Source:** ${String(data.source || "Not recorded")}`].join("\n");
}

function fmtLeadOwner(data: LeadData): string {
  return [
    `## ${leadLabel(data)}`,
    data.assignedTo ? `👤 **Assigned To:** ${data.assignedTo}` : "_No assignee recorded._",
  ].join("\n");
}

function fmtLeadFollowUp(data: LeadData): string {
  return [
    `## ${leadLabel(data)}`,
    `**Next Follow-up:** ${formatDateValue(data.nextFollowUpDate)}`,
    data.nextFollowUpTime ? `**Follow-up Time:** ${data.nextFollowUpTime}` : null,
  ].filter(Boolean).join("\n");
}

function fmtLeadAll(data: LeadData): string {
  const lines = [`## ${leadLabel(data)}`];
  lines.push(`**Phone:** ${data.phone || "Not recorded"}`);
  if (data.whatsapp) lines.push(`**WhatsApp:** ${data.whatsapp}`);
  if (data.email) lines.push(`**Email:** ${data.email}`);
  lines.push(`**City:** ${data.city || "Not recorded"}`);
  if (data.address) lines.push(`**Address:** ${data.address}`);
  lines.push(`**Source:** ${String(data.source || "Not recorded")}`);
  lines.push(`**Property Type:** ${String(data.propertyType || "Not recorded")}`);
  if (data.budget) lines.push(`**Budget:** ${data.budget}`);
  if (data.assignedTo) lines.push(`**Assigned To:** ${data.assignedTo}`);
  lines.push(`**Status:** ${String(data.status || "New Lead")}`);
  lines.push(`**Total Calls:** ${data.totalCalls ?? 0}`);
  lines.push(`**Created:** ${formatDateValue(data.createdAt)}`);
  lines.push(`**Updated:** ${formatDateValue(data.updatedAt)}`);
  if (data.lastCallDate) lines.push(`**Last Call:** ${formatDateValue(data.lastCallDate)}`);
  if (data.lastCallOutcome) lines.push(`**Last Call Outcome:** ${data.lastCallOutcome}`);
  if (data.nextFollowUpDate) lines.push(`**Next Follow-up:** ${formatDateValue(data.nextFollowUpDate)}`);
  if (data.nextFollowUpTime) lines.push(`**Follow-up Time:** ${data.nextFollowUpTime}`);
  if (data.priority) lines.push(`**Priority:** ${data.priority}`);
  if (data.notes) lines.push(`**Notes:** ${data.notes}`);
  return lines.join("\n");
}

function fmtLeadCalls(lead: LeadData, callLogs: CallLogData[]): string {
  const lines = [`## ${leadLabel(lead)}`, "### Call History"];
  const calls = callLogs
    .filter((log) => String(log.leadId ?? "") === lead.id)
    .slice(0, 10);
  if (calls.length === 0) {
    lines.push("_No call logs found._");
    return lines.join("\n");
  }

  for (const call of calls) {
    const date = String(call.date ?? "");
    const time = String(call.time ?? "");
    const outcome = String(call.outcome ?? "");
    const notes = String(call.notes ?? "");
    lines.push(`- ${date}${time ? ` ${time}` : ""} | ${outcome}${notes ? ` | ${notes}` : ""}`);
  }

  return lines.join("\n");
}

// ── Per-type formatters ────────────────────────────────────────────────────

function fmtPhone(data: ProjectData): string {
  const phone = String(data.clientPhone || "");
  return [
    `## ${clientLabel(data)}`,
    phone ? `📞 **Phone:** ${phone}` : "_No phone number recorded._",
  ].join("\n");
}

function fmtAddress(data: ProjectData): string {
  const parts = [data.address, data.city, data.landmark ? `near ${data.landmark}` : null]
    .filter(Boolean)
    .map(String);
  const full = parts.join(", ") || null;
  const lines = [`## ${clientLabel(data)}`];
  if (full) lines.push(`📍 **Address:** ${full}`);
  else lines.push("_No address recorded._");
  if (data.googleMapsLink) lines.push(`🗺️ [Open in Maps](${data.googleMapsLink})`);
  return lines.join("\n");
}

function fmtStatus(data: ProjectData): string {
  const s = String(data.status ?? "planning");
  return [
    `## ${clientLabel(data)}`,
    `**Status:** ${statusEmoji(s)} ${statusLabel(s)}`,
    data.progress !== undefined ? `**Progress:** ${data.progress}%` : null,
  ].filter(Boolean).join("\n");
}

function fmtManager(data: ProjectData): string {
  const mgr = String(data.siteManagerName || "");
  return [
    `## ${clientLabel(data)}`,
    mgr ? `👷 **Site Manager:** ${mgr}` : "_No site manager recorded._",
  ].join("\n");
}

function fmtAdvance(data: ProjectData): string {
  const amt = (data.amount as number | string | null | undefined)
    ?? getAdvanceAmountFromWorkflow(data.workflow);
  return [
    `## ${clientLabel(data)}`,
    `💰 **Advance Received:** ${formatAmount(amt)}`,
  ].join("\n");
}

function fmtDeadline(data: ProjectData): string {
  return [
    `## ${clientLabel(data)}`,
    `📅 **Deadline:** ${formatDeadlineStr(data)}`,
  ].join("\n");
}

function fmtWorkflow(data: ProjectData): string {
  const lines = [`## ${clientLabel(data)}`, "", "### Workflow Steps"];
  if (!Array.isArray(data.workflow) || data.workflow.length === 0) {
    lines.push("_No workflow steps defined._");
    return lines.join("\n");
  }
  for (const node of data.workflow as any[]) {
    if (!node) continue;
    const title = String(node.title ?? node.key ?? "Unnamed step");
    const icon = node.completed ? "✅" : "⏳";
    const amt = node.amount ?? (typeof node.value === "number" ? node.value : null);
    const amtStr = amt !== null && amt !== undefined ? ` — ₹${Number(amt).toLocaleString("en-IN")}` : "";
    lines.push(`- ${icon} ${title}${amtStr}`);
  }
  return lines.join("\n");
}

function fmtContacts(data: ProjectData): string {
  const lines = [`## ${clientLabel(data)}`, "", "### Site Contacts"];
  if (data.siteManagerName) {
    lines.push(`👷 **Site Manager:** ${data.siteManagerName}`);
  }
  const contacts = Array.isArray(data.siteContacts) ? data.siteContacts as { designation: string; name: string; phone: string }[] : [];
  if (contacts.length === 0 && !data.siteManagerName) {
    lines.push("_No contacts recorded._");
  }
  for (const c of contacts) {
    const icon = contactIcon(c.designation || "");
    const label = c.designation || "Contact";
    const namePart = c.name ? c.name : "";
    const phonePart = c.phone ? c.phone : "";
    const detail = [namePart, phonePart].filter(Boolean).join(" — ");
    lines.push(`${icon} **${label}:** ${detail || "_not recorded_"}`);
  }
  return lines.join("\n");
}

function fmtAll(data: ProjectData): string {
  const s = String(data.status ?? "planning");
  const lines: string[] = [`## ${clientLabel(data)}`];

  // Overview line
  lines.push(
    `**Status:** ${statusEmoji(s)} ${statusLabel(s)} | **Progress:** ${data.progress ?? 0}%`
  );
  if (data.siteManagerName) lines.push(`**Site Manager:** ${data.siteManagerName}`);
  if (data.clientPhone) lines.push(`**Phone:** ${data.clientPhone}`);

  // Address
  const addressParts = [data.address, data.city, data.landmark ? `near ${data.landmark}` : null]
    .filter(Boolean).map(String);
  if (addressParts.length) lines.push(`**Address:** ${addressParts.join(", ")}`);

  // Dates
  if (data.startDate) {
    const sd = new Date(String(data.startDate));
    lines.push(`**Start Date:** ${isNaN(sd.getTime()) ? String(data.startDate) : sd.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`);
  }
  lines.push(`**Deadline:** ${formatDeadlineStr(data)}`);

  // Advance
  const amt = (data.amount as number | string | null | undefined)
    ?? getAdvanceAmountFromWorkflow(data.workflow);
  if (amt !== null && amt !== undefined && amt !== "") {
    lines.push(`**Advance Received:** ${formatAmount(amt)}`);
  }

  // Workflow
  if (Array.isArray(data.workflow) && data.workflow.length > 0) {
    lines.push("", "### Workflow");
    const workflow = data.workflow as any[];
    for (const node of workflow) {
      if (!node) continue;
      const title = String(node.title ?? node.key ?? "Unnamed step");
      const icon = node.completed ? "✅" : "⏳";
      const nodeAmt = node.amount ?? (typeof node.value === "number" ? node.value : null);
      const amtStr = nodeAmt !== null && nodeAmt !== undefined ? ` — ₹${Number(nodeAmt).toLocaleString("en-IN")}` : "";
      lines.push(`- ${icon} ${title}${amtStr}`);
    }
    const completed = workflow.filter((n) => n?.completed);
    const pending = workflow.filter((n) => n && !n.completed);
    const lastDone = completed[completed.length - 1];
    lines.push("");
    if (lastDone) lines.push(`**Last Completed:** ${String(lastDone.title ?? lastDone.key ?? "—")}`);
    if (pending.length > 0) lines.push(`**Pending Steps:** ${pending.length}`);
  }

  return lines.join("\n");
}

function fmtUpdate(data: ProjectData): string {
  const s = String(data.status ?? "planning");
  const lines: string[] = [`## ${clientLabel(data)}`];

  lines.push(
    `**Status:** ${statusEmoji(s)} ${statusLabel(s)} | **Progress:** ${data.progress ?? 0}%`
  );
  if (data.siteManagerName) lines.push(`**Site Manager:** ${data.siteManagerName}`);

  if (Array.isArray(data.workflow) && data.workflow.length > 0) {
    const workflow = data.workflow as any[];
    const completed = workflow.filter((n) => n?.completed);
    const pending = workflow.filter((n) => n && !n.completed);
    const lastDone = completed[completed.length - 1];
    if (lastDone) lines.push(`**Last Completed:** ${String(lastDone.title ?? lastDone.key ?? "—")}`);
    if (pending.length > 0) {
      lines.push(
        `**Pending (${pending.length}):** ${pending.map((n) => String(n.title ?? n.key ?? "?")).join(", ")}`
      );
    }
  }

  return lines.join("\n");
}

function formatByQueryType(type: QueryType, data: ProjectData): string {
  switch (type) {
    case "phone":    return fmtPhone(data);
    case "address":  return fmtAddress(data);
    case "status":   return fmtStatus(data);
    case "manager":  return fmtManager(data);
    case "advance":  return fmtAdvance(data);
    case "deadline": return fmtDeadline(data);
    case "workflow": return fmtWorkflow(data);
    case "contacts": return fmtContacts(data);
    case "all":      return fmtAll(data);
    default:         return fmtUpdate(data);
  }
}

// ── Project keyword detection ──────────────────────────────────────────────

const PROJECT_KEYWORDS = [
  "project", "client", "site", "status", "progress", "stage",
  "manager", "deadline", "address", "city", "phone", "workflow",
  "installation", "completed", "in progress", "pending",
  "advance", "payment", "paid", "invoice", "balance", "received", "due",
  "update", "status update", "what is happening", "progress on",
  "kya chal raha", "latest on", "kya hua", "batao",
];

function isProjectRelated(message: string): boolean {
  const lower = message.toLowerCase();
  return PROJECT_KEYWORDS.some((kw) => lower.includes(kw));
}

const INVENTORY_KEYWORDS = [
  "inventory", "inventory sheet", "sheet", "spreadsheet", "google sheet", "stock",
  "product sheet", "catalog", "catalogue", "sheet url", "spreadsheet id", "embed url",
  "sheet link", "sheet name",
];

function isInventoryRelated(message: string): boolean {
  const lower = message.toLowerCase();
  return INVENTORY_KEYWORDS.some((kw) => lower.includes(kw));
}

const LEAD_KEYWORDS = [
  "lead", "leads", "follow up", "follow-up", "sales", "prospect", "call log", "call logs",
  "call history", "pipeline", "conversion", "assigned to", "next follow up", "next follow-up",
  "hot lead", "new lead",
];

function isLeadRelated(message: string): boolean {
  const lower = message.toLowerCase();
  return LEAD_KEYWORDS.some((kw) => lower.includes(kw));
}

function isRecentSentQuery(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    (lower.includes("recent") && (lower.includes("sent") || lower.includes("sent to clients"))) ||
    lower.includes("recent things sent") ||
    lower.includes("what was sent to clients") ||
    lower.includes("things sent to clients")
  );
}

// ── Project matching ───────────────────────────────────────────────────────

function normalizeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !["the", "and", "for", "from", "with", "what", "who", "how", "much", "been"].includes(t));
}

function scoreProjectMatch(messageTokens: string[], data: ProjectData): number {
  const fields = [data.name, data.clientName, data.siteManagerName, data.address, data.city, data.landmark]
    .filter(Boolean)
    .map((v) => normalizeTokens(String(v)).join(" "));
  const haystack = new Set(normalizeTokens(fields.join(" ")));
  return messageTokens.reduce((score, token) => score + (haystack.has(token) ? 1 : 0), 0);
}

function scoreInventoryMatch(messageTokens: string[], data: InventorySheetData): number {
  const fields = [data.name, data.originalUrl, data.spreadsheetId, data.embedUrl]
    .filter(Boolean)
    .map((v) => normalizeTokens(String(v)).join(" "));
  const haystack = new Set(normalizeTokens(fields.join(" ")));
  return messageTokens.reduce((score, token) => score + (haystack.has(token) ? 1 : 0), 0);
}

function scoreLeadMatch(messageTokens: string[], data: LeadData): number {
  const fields = [data.name, data.phone, data.whatsapp, data.email, data.city, data.address, data.source, data.assignedTo, data.status, data.propertyType, data.notes]
    .filter(Boolean)
    .map((v) => normalizeTokens(String(v)).join(" "));
  const haystack = new Set(normalizeTokens(fields.join(" ")));
  return messageTokens.reduce((score, token) => score + (haystack.has(token) ? 1 : 0), 0);
}

async function fetchAllLeadsData(): Promise<LeadData[]> {
  return (await fetchLeads()) as LeadData[];
}

async function fetchAllCallLogsData(): Promise<CallLogData[]> {
  return (await fetchCallLogs()) as CallLogData[];
}

async function findBestLeadMatch(message: string): Promise<LeadData | null> {
  const leads = await fetchAllLeadsData();
  if (leads.length === 0) return null;

  const lowerMessage = message.toLowerCase();
  const messageTokens = normalizeTokens(message);
  const rawWords = lowerMessage.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 2);

  let best: LeadData | null = null;
  let bestScore = 0;

  for (const lead of leads) {
    let score = scoreLeadMatch(messageTokens, lead);

    const nameFields = [lead.name, lead.phone, lead.email, lead.city, lead.assignedTo].filter(Boolean).map((v) => String(v).toLowerCase());
    for (const field of nameFields) {
      const fieldWords = field.split(/\s+/).filter((w) => w.length >= 2);
      for (const fw of fieldWords) {
        if (rawWords.includes(fw)) score += 3;
        else if (lowerMessage.includes(fw) && fw.length >= 3) score += 2;
      }
      for (const mw of rawWords) {
        if (mw.length >= 3 && field.includes(mw)) score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = lead;
    }
  }

  return bestScore > 0 ? best : null;
}

async function findNamedLeadInMessage(message: string): Promise<LeadData | null> {
  const leads = await fetchAllLeadsData();
  if (leads.length === 0) return null;

  const lowerMessage = message.toLowerCase();
  const rawWords = lowerMessage.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 2);

  for (const lead of leads) {
    const nameFields = [lead.name, lead.phone, lead.email, lead.city, lead.assignedTo].filter(Boolean).map((v) => String(v).toLowerCase());
    for (const field of nameFields) {
      const fieldWords = field.split(/\s+/).filter((w) => w.length >= 2);
      const allWordsMatch = fieldWords.length > 0 && fieldWords.every((fw) => rawWords.includes(fw));
      const fullFieldMatch = lowerMessage.includes(field);
      const singleWordMatch = fieldWords.length === 1 && rawWords.includes(fieldWords[0]);
      if (allWordsMatch || fullFieldMatch || singleWordMatch) return lead;
    }
  }

  return null;
}

async function fetchAllInventorySheets(): Promise<InventorySheetData[]> {
  const snapshot = await getDocs(query(collection(db, "inventorySheets"), orderBy("createdAt", "desc")));
  const docs = snapshot.docs as Array<{ id: string; data: () => Record<string, unknown> }>;
  const sheets: InventorySheetData[] = [];
  for (const doc of docs) {
    const normalized = normalizeSheetFromFirestore(doc.id, doc.data());
    sheets.push(normalized as unknown as InventorySheetData);
  }
  return sheets;
}

async function findBestInventorySheetMatch(message: string): Promise<InventorySheetData | null> {
  const sheets = await fetchAllInventorySheets();
  if (sheets.length === 0) return null;

  const lowerMessage = message.toLowerCase();
  const messageTokens = normalizeTokens(message);
  const rawWords = lowerMessage.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 2);

  let best: InventorySheetData | null = null;
  let bestScore = 0;

  for (const sheet of sheets) {
    let score = scoreInventoryMatch(messageTokens, sheet);

    const nameFields = [sheet.name, sheet.spreadsheetId].filter(Boolean).map((v) => String(v).toLowerCase());
    for (const field of nameFields) {
      const fieldWords = field.split(/\s+/).filter((w) => w.length >= 2);
      for (const fw of fieldWords) {
        if (rawWords.includes(fw)) score += 3;
        else if (lowerMessage.includes(fw) && fw.length >= 3) score += 2;
      }
      for (const mw of rawWords) {
        if (mw.length >= 3 && field.includes(mw)) score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = sheet;
    }
  }

  return bestScore > 0 ? best : null;
}

async function findNamedInventorySheetInMessage(message: string): Promise<InventorySheetData | null> {
  const sheets = await fetchAllInventorySheets();
  if (sheets.length === 0) return null;

  const lowerMessage = message.toLowerCase();
  const rawWords = lowerMessage.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 2);

  for (const sheet of sheets) {
    const nameFields = [sheet.name, sheet.spreadsheetId].filter(Boolean).map((v) => String(v).toLowerCase());
    for (const field of nameFields) {
      const fieldWords = field.split(/\s+/).filter((w) => w.length >= 2);
      const allWordsMatch = fieldWords.length > 0 && fieldWords.every((fw) => rawWords.includes(fw));
      const fullFieldMatch = lowerMessage.includes(field);
      const singleWordMatch = fieldWords.length === 1 && rawWords.includes(fieldWords[0]);
      if (allWordsMatch || fullFieldMatch || singleWordMatch) return sheet;
    }
  }

  return null;
}

async function findBestProjectMatch(message: string): Promise<ProjectData | null> {
  const snapshot = await getDocs(query(collection(db, "projects"), orderBy("updatedAt", "desc")));
  if (snapshot.empty) return null;

  const lowerMessage = message.toLowerCase();
  const messageTokens = normalizeTokens(message);
  const rawWords = lowerMessage.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 2);

  let best: ProjectData | null = null;
  let bestScore = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data() as ProjectData;
    if (data.deleted) continue;

    let score = scoreProjectMatch(messageTokens, data);

    const nameFields = [data.name, data.clientName].filter(Boolean).map((v) => String(v).toLowerCase());
    for (const field of nameFields) {
      const fieldWords = field.split(/\s+/).filter((w) => w.length >= 2);
      for (const fw of fieldWords) {
        if (rawWords.includes(fw)) score += 3;
        else if (lowerMessage.includes(fw) && fw.length >= 3) score += 2;
      }
      for (const mw of rawWords) {
        if (mw.length >= 3 && field.includes(mw)) score += 1;
      }
    }

    if (score > bestScore) { bestScore = score; best = data; }
  }

  return bestScore > 0 ? best : null;
}

async function findNamedProjectInMessage(message: string): Promise<ProjectData | null> {
  const snapshot = await getDocs(query(collection(db, "projects"), orderBy("updatedAt", "desc")));
  if (snapshot.empty) return null;

  const lowerMessage = message.toLowerCase();
  const rawWords = lowerMessage.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 2);

  for (const doc of snapshot.docs) {
    const data = doc.data() as ProjectData;
    if (data.deleted) continue;

    const nameFields = [data.name, data.clientName].filter(Boolean).map((v) => String(v).toLowerCase());
    for (const field of nameFields) {
      const fieldWords = field.split(/\s+/).filter((w) => w.length >= 2);
      const allWordsMatch = fieldWords.length > 0 && fieldWords.every((fw) => rawWords.includes(fw));
      const fullFieldMatch = lowerMessage.includes(field);
      const singleWordMatch = fieldWords.length === 1 && rawWords.includes(fieldWords[0]);
      if (allWordsMatch || fullFieldMatch || singleWordMatch) return data;
    }
  }
  return null;
}

// ── Audit log helpers ──────────────────────────────────────────────────────

function formatAuditResults(logs: any[], limit = 8): string {
  if (!Array.isArray(logs) || logs.length === 0) return "No recent sent items found.";
  const keywords = ["send", "sent", "email", "invoice", "shared", "delivered"];
  const filtered = logs.filter((l) => {
    const desc = (l.description || "").toLowerCase();
    const type = (l.actionType || "").toLowerCase();
    return keywords.some((k) => desc.includes(k) || type.includes(k));
  });
  return (filtered.length ? filtered : logs).slice(0, limit).map((l) => {
    const time = l.timestamp instanceof Date ? l.timestamp.toISOString().split("T")[0] : String(l.timestamp);
    return `- [${time}] ${l.projectName}: ${l.description}`;
  }).join("\n");
}

// ── All-projects fallback context for LLM ─────────────────────────────────

async function fetchAllProjectsContext(message: string): Promise<string> {
  try {
    const snapshot = await getDocs(query(collection(db, "projects"), orderBy("updatedAt", "desc")));
    if (snapshot.empty) return "No projects found.";

    const lowerMessage = message.toLowerCase();
    const lines: string[] = ["Current Projects in Galaxy System:\n"];

    for (const doc of snapshot.docs) {
      const d = doc.data();
      if (d.deleted) continue;
      const nameMatch = String(d.name ?? "").toLowerCase();
      const clientMatch = String(d.clientName ?? "").toLowerCase();
      if (
        message.length > 5 &&
        nameMatch && !lowerMessage.includes(nameMatch) &&
        clientMatch && !lowerMessage.includes(clientMatch)
      ) continue;

      lines.push(`Project: ${d.name || "Unnamed"}`);
      if (d.clientName) lines.push(`  Client: ${d.clientName}`);
      if (d.status) lines.push(`  Status: ${d.status}`);
      if (d.progress !== undefined) lines.push(`  Progress: ${d.progress}%`);
      if (d.siteManagerName) lines.push(`  Site Manager: ${d.siteManagerName}`);
      if (d.clientPhone) lines.push(`  Phone: ${d.clientPhone}`);
      if (d.city) lines.push(`  City: ${d.city}`);
      if (d.address) lines.push(`  Address: ${d.address}`);
      if (d.deadline) lines.push(`  Deadline: ${d.deadline?.toDate ? d.deadline.toDate().toLocaleDateString("en-IN") : d.deadline}`);
      const advAmt = getAdvanceAmountFromWorkflow(d.workflow);
      if (advAmt !== null) lines.push(`  Advance Received: ${formatAmount(advAmt)}`);
      lines.push("");
    }

    return lines.join("\n");
  } catch {
    return "Unable to fetch project data at this time.";
  }
}

async function fetchAllInventoryContext(message: string): Promise<string> {
  try {
    const sheets = await fetchAllInventorySheets();
    if (sheets.length === 0) return "No inventory sheets found.";

    const lowerMessage = message.toLowerCase();
    const lines: string[] = ["Inventory Sheets in Galaxy System:\n"];

    for (const sheet of sheets) {
      const nameMatch = String(sheet.name ?? "").toLowerCase();
      const idMatch = String(sheet.spreadsheetId ?? "").toLowerCase();
      if (
        message.length > 5 &&
        nameMatch && !lowerMessage.includes(nameMatch) &&
        idMatch && !lowerMessage.includes(idMatch)
      ) continue;

      lines.push(`Sheet: ${sheet.name || "Unnamed"}`);
      if (sheet.spreadsheetId) lines.push(`  Spreadsheet ID: ${sheet.spreadsheetId}`);
      if (sheet.originalUrl) lines.push(`  Source URL: ${sheet.originalUrl}`);
      if (sheet.embedUrl) lines.push(`  Embed URL: ${sheet.embedUrl}`);
      if (sheet.createdAt) lines.push(`  Created: ${sheet.createdAt}`);
      if (sheet.createdBy?.displayName) lines.push(`  Created By: ${sheet.createdBy.displayName}`);
      else if (sheet.createdBy?.email) lines.push(`  Created By: ${sheet.createdBy.email}`);
      lines.push("");
    }

    return lines.join("\n");
  } catch {
    return "Unable to fetch inventory data at this time.";
  }
}

async function fetchAllLeadsContext(message: string): Promise<string> {
  try {
    const leads = await fetchAllLeadsData();
    if (leads.length === 0) return "No leads found.";

    const lowerMessage = message.toLowerCase();
    const lines: string[] = ["Leads in Galaxy System:\n"];

    for (const lead of leads) {
      const nameMatch = String(lead.name ?? "").toLowerCase();
      const cityMatch = String(lead.city ?? "").toLowerCase();
      const phoneMatch = String(lead.phone ?? "").toLowerCase();
      const assigneeMatch = String(lead.assignedTo ?? "").toLowerCase();
      if (
        message.length > 5 &&
        nameMatch && !lowerMessage.includes(nameMatch) &&
        cityMatch && !lowerMessage.includes(cityMatch) &&
        phoneMatch && !lowerMessage.includes(phoneMatch) &&
        assigneeMatch && !lowerMessage.includes(assigneeMatch)
      ) continue;

      lines.push(`Lead: ${lead.name || "Unnamed"}`);
      if (lead.phone) lines.push(`  Phone: ${lead.phone}`);
      if (lead.city) lines.push(`  City: ${lead.city}`);
      if (lead.status) lines.push(`  Status: ${lead.status}`);
      if (lead.source) lines.push(`  Source: ${lead.source}`);
      if (lead.propertyType) lines.push(`  Property Type: ${lead.propertyType}`);
      if (lead.assignedTo) lines.push(`  Assigned To: ${lead.assignedTo}`);
      if (lead.priority) lines.push(`  Priority: ${lead.priority}`);
      if (lead.nextFollowUpDate) lines.push(`  Next Follow-up: ${lead.nextFollowUpDate}${lead.nextFollowUpTime ? ` ${lead.nextFollowUpTime}` : ""}`);
      if (lead.lastCallOutcome) lines.push(`  Last Call Outcome: ${lead.lastCallOutcome}`);
      if (lead.totalCalls !== undefined) lines.push(`  Total Calls: ${lead.totalCalls}`);
      lines.push("");
    }

    return lines.join("\n");
  } catch {
    return "Unable to fetch lead data at this time.";
  }
}

// ── LLM generators ────────────────────────────────────────────────────────

type HistoryEntry = { role: "user" | "bot"; content: string };

async function generateWithGemini(message: string, systemPrompt: string, history: HistoryEntry[] = []): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const primaryModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const fallbackModels = (process.env.GEMINI_FALLBACK_MODELS || "gemini-3.5-flash")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const modelsToTry = [primaryModel, ...fallbackModels.filter((m) => m !== primaryModel)];

  const geminiHistory: Content[] = history.flatMap((entry): Content[] => ([
    entry.role === "user"
      ? { role: "user", parts: [{ text: entry.content }] }
      : { role: "model", parts: [{ text: entry.content }] },
  ]));

  let result: any = null;
  for (const modelName of modelsToTry) {
    const modelRef = genAI.getGenerativeModel({ model: modelName, systemInstruction: systemPrompt });
    const chat = modelRef.startChat({ history: geminiHistory });
    try {
      let attempt = 0;
      while (attempt < 3) {
        try { result = await chat.sendMessage(message); break; }
        catch (err: any) {
          attempt++;
          const msg = err?.message || String(err);
          if (msg.includes("404") || /not found/i.test(msg)) throw err;
          if (attempt >= 3) throw err;
          await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
        }
      }
      break;
    } catch (err: any) {
      if (/not found|404/i.test(err?.message || String(err))) continue;
      throw err;
    }
  }

  if (!result) throw new Error("All configured Gemini models failed");
  return result.response?.text ? result.response.text() : String(result);
}

async function generateWithOllama(message: string, systemPrompt: string, history: HistoryEntry[] = []): Promise<string> {
  const tunnelUrl = process.env.OLLAMA_TUNNEL_URL;
  if (!tunnelUrl) throw new Error("OLLAMA_TUNNEL_URL not configured");

  const historySection = history.length > 0
    ? history.map((e) => (e.role === "user" ? `User: ${e.content}` : `Assistant: ${e.content}`)).join("\n")
    : null;

  const fullPrompt = [
    (historySection
      ? "You are SOP-Bot. You can also answer questions about the current conversation history. If the user asks about previous messages, summarize them.\n\n"
      : "") + systemPrompt,
    historySection ? `Previous conversation:\n${historySection}` : null,
    `User question: ${message}`,
  ].filter(Boolean).join("\n\n");

  const res = await fetch(`${tunnelUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "qwen3:8b",
      prompt: fullPrompt,
      stream: false,
      options: { num_predict: 1200, temperature: 0.7, num_ctx: 8192 },
    }),
    signal: AbortSignal.timeout(90000),
  });

  if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
  const raw: string = (await res.json()).response ?? "";
  // Qwen3 and other reasoning models prepend <think>…</think> blocks — strip them
  return raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { message, model, history = [] } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    let answeredBy: "gemini" | "ollama" = model === "ollama" ? "ollama" : "gemini";

    // 1. Named-project first-pass — skip if user is asking about quotations
    if (!isQuotationRelated(message)) {
      const namedProject = await findNamedProjectInMessage(message);
      if (namedProject) {
        const queryType = detectProjectQueryType(message);
        return NextResponse.json({
          answer: formatByQueryType(queryType, namedProject),
          source: "Live Project Data",
          answeredBy,
        });
      }

      const namedInventorySheet = await findNamedInventorySheetInMessage(message);
      if (namedInventorySheet) {
        return NextResponse.json({
          answer: fmtInventorySheet(namedInventorySheet),
          source: "Live Inventory Data",
          answeredBy,
        });
      }

      const namedLead = await findNamedLeadInMessage(message);
      if (namedLead) {
        const leadQuestion = message.toLowerCase();
        let answer = fmtLeadAll(namedLead);
        if (leadQuestion.includes("phone") || leadQuestion.includes("number") || leadQuestion.includes("contact")) answer = fmtLeadPhone(namedLead);
        else if (leadQuestion.includes("status") || leadQuestion.includes("progress")) answer = fmtLeadStatus(namedLead);
        else if (leadQuestion.includes("source")) answer = fmtLeadSource(namedLead);
        else if (leadQuestion.includes("assigned") || leadQuestion.includes("owner") || leadQuestion.includes("manager")) answer = fmtLeadOwner(namedLead);
        else if (leadQuestion.includes("follow") || leadQuestion.includes("callback") || leadQuestion.includes("next call")) answer = fmtLeadFollowUp(namedLead);
        else if (leadQuestion.includes("call history") || leadQuestion.includes("call log") || leadQuestion.includes("calls")) {
          const callLogs = await fetchAllCallLogsData();
          answer = fmtLeadCalls(namedLead, callLogs);
        }

        return NextResponse.json({
          answer,
          source: "Live Lead Data",
          answeredBy,
        });
      }
    }

    // 2. Recent sent-items query
    if (isRecentSentQuery(message)) {
      try {
        const logs = await fetchAuditLogs();
        return NextResponse.json({
          answer: `## Recent Items Sent to Clients\n\n${formatAuditResults(logs, 10)}`,
          source: "Audit Logs",
          answeredBy,
        });
      } catch (e) {
        console.error("Failed to fetch audit logs:", e);
      }
    }

    // 3. Generic project-related query: find best fuzzy match and format
    if (isProjectRelated(message)) {
      const project = await findBestProjectMatch(message);
      if (project) {
        const queryType = detectProjectQueryType(message);
        return NextResponse.json({
          answer: formatByQueryType(queryType, project),
          source: "Live Project Data",
          answeredBy,
        });
      }
    }

    // 4. Generic inventory-related query: find best fuzzy match and format
    if (isInventoryRelated(message)) {
      const inventorySheet = await findBestInventorySheetMatch(message);
      if (inventorySheet) {
        return NextResponse.json({
          answer: fmtInventorySheet(inventorySheet),
          source: "Live Inventory Data",
          answeredBy,
        });
      }
    }

    if (isLeadRelated(message)) {
      const lead = await findBestLeadMatch(message);
      if (lead) {
        const lower = message.toLowerCase();
        let answer = fmtLeadAll(lead);
        if (lower.includes("phone") || lower.includes("number") || lower.includes("contact")) answer = fmtLeadPhone(lead);
        else if (lower.includes("status") || lower.includes("progress")) answer = fmtLeadStatus(lead);
        else if (lower.includes("source")) answer = fmtLeadSource(lead);
        else if (lower.includes("assigned") || lower.includes("owner") || lower.includes("manager")) answer = fmtLeadOwner(lead);
        else if (lower.includes("follow") || lower.includes("callback") || lower.includes("next call")) answer = fmtLeadFollowUp(lead);
        else if (lower.includes("call history") || lower.includes("call log") || lower.includes("calls")) {
          const callLogs = await fetchAllCallLogsData();
          answer = fmtLeadCalls(lead, callLogs);
        }

        return NextResponse.json({
          answer,
          source: "Live Lead Data",
          answeredBy,
        });
      }
    }

    // 5. Fall through to LLM with optional project/inventory/lead/quotation context
    let dynamicContext = "";
    let source = "Galaxy SOP Knowledge Base";

    const includeProjectContext = isProjectRelated(message);
    const includeInventoryContext = isInventoryRelated(message);
    const includeLeadContext = isLeadRelated(message);

    if (includeProjectContext) {
      dynamicContext = await fetchAllProjectsContext(message);
      source = "Galaxy SOP Knowledge Base + Live Project Data";
    }

    if (includeInventoryContext) {
      const inventoryCtx = await fetchAllInventoryContext(message);
      dynamicContext += dynamicContext ? `\n\n${inventoryCtx}` : inventoryCtx;
      source = source.includes("Project")
        ? "Galaxy SOP Knowledge Base + Live Project & Inventory Data"
        : "Galaxy SOP Knowledge Base + Live Inventory Data";
    }

    if (includeLeadContext) {
      const leadCtx = await fetchAllLeadsContext(message);
      dynamicContext += dynamicContext ? `\n\n${leadCtx}` : leadCtx;
      if (source.includes("Project") && source.includes("Inventory")) {
        source = "Galaxy SOP Knowledge Base + Live Project, Inventory & Lead Data";
      } else if (source.includes("Project")) {
        source = "Galaxy SOP Knowledge Base + Live Project & Lead Data";
      } else if (source.includes("Inventory")) {
        source = "Galaxy SOP Knowledge Base + Live Inventory & Lead Data";
      } else {
        source = "Galaxy SOP Knowledge Base + Live Lead Data";
      }
    }

    if (isQuotationRelated(message)) {
      try {
        const quotes = await fetchAllQuotes();
        const quotesCtx = formatQuotesContext(quotes);
        dynamicContext += `\n\nLIVE QUOTATION DATA:\n${quotesCtx}`;
        if (source.includes("Project") && source.includes("Inventory")) {
          source = includeLeadContext
            ? "Galaxy SOP Knowledge Base + Live Project, Inventory, Lead & Quotation Data"
            : "Galaxy SOP Knowledge Base + Live Project, Inventory & Quotation Data";
        } else if (source.includes("Project")) {
          source = includeLeadContext
            ? "Galaxy SOP Knowledge Base + Live Project, Lead & Quotation Data"
            : "Galaxy SOP Knowledge Base + Live Project & Quotation Data";
        } else if (source.includes("Inventory")) {
          source = includeLeadContext
            ? "Galaxy SOP Knowledge Base + Live Inventory, Lead & Quotation Data"
            : "Galaxy SOP Knowledge Base + Live Inventory & Quotation Data";
        } else if (includeLeadContext) {
          source = "Galaxy SOP Knowledge Base + Live Lead & Quotation Data";
        } else {
          source = "Galaxy SOP Knowledge Base + Live Quotation Data";
        }
      } catch (e) {
        console.error("Failed to fetch quotations:", e);
      }
    }

    const systemPrompt = `You are SOP-Bot, an internal assistant for Galaxy Home Automation LLP — a home automation company in Mumbai working exclusively with Zigbee protocol. You help staff answer questions about company SOPs, pricing, warranties, installation procedures, live project data, and quotations.

Always be concise, accurate, and professional. Format responses in clean markdown.

PRICING CALCULATION RULES (use these when asked about discounts or totals):
- Each product category can have its own discount % (sectionDiscounts)
- Discounted unit price = round(unitPrice × (1 - discount%/100))
- Discounted subtotal per item = discounted unit price × qty
- Installation charge: LCD_PANELS = 0%, LOCKS = 10%, all others = 15% of discounted subtotal
- GST = 18% applied on (discounted subtotal + installation)
- Grand Total = discounted subtotal + installation + GST
- When user asks "what if discount is X%", recalculate using the above formula on the product data provided

${GALAXY_STATIC_CONTEXT}
${dynamicContext ? `\n---\nLIVE DATA:\n${dynamicContext}` : ""}`;

    let answer: string;
    if (model === "ollama") {
      try {
        answer = await generateWithOllama(message, systemPrompt, history);
      } catch (ollamaErr) {
        console.error("Ollama failed, falling back to Gemini:", ollamaErr);
        answer = await generateWithGemini(message, systemPrompt, history);
        answeredBy = "gemini";
        source += " (Ollama unavailable, used Gemini)";
      }
    } else {
      answer = await generateWithGemini(message, systemPrompt, history);
    }

    return NextResponse.json({ answer, source, answeredBy });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
