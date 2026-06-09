import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GALAXY_STATIC_CONTEXT } from "@/lib/sopContext";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { fetchAuditLogs } from "@/lib/firestore/audit";
import { db } from "@/lib/firebase";

const PROJECT_KEYWORDS = [
  "project", "client", "site", "status", "progress", "stage",
  "manager", "deadline", "address", "city", "phone", "workflow",
  "installation", "completed", "in progress", "pending",
  "advance", "payment", "paid", "invoice", "balance", "received", "due",
];

function isProjectRelated(message: string): boolean {
  const lower = message.toLowerCase();
  return PROJECT_KEYWORDS.some((kw) => lower.includes(kw));
}

function isAdvanceQuery(message: string): boolean {
  const lower = message.toLowerCase();
  return ["advance", "amount", "received", "payment", "paid", "balance", "invoice"].some((kw) =>
    lower.includes(kw)
  );
}

function isProjectDetailsQuery(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("all details") ||
    lower.includes("details of") ||
    lower.startsWith("give me details") ||
    lower.startsWith("give me all details") ||
    lower.includes("show details") ||
    lower.includes("tell me about")
  );
}

function isRecentSentQuery(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("recent") && (lower.includes("sent") || lower.includes("sent to") || lower.includes("sent clients") || lower.includes("sent to clients")) ||
    lower.includes("recent things sent") ||
    lower.includes("recent items sent") ||
    lower.includes("what was sent to clients") ||
    lower.includes("things sent to clients")
  );
}

function formatAuditResults(logs: any[], limitResults = 8): string {
  if (!Array.isArray(logs) || logs.length === 0) return "No recent sent items found.";

  const keywords = ["send", "sent", "email", "invoice", "shared", "delivered", "sent to client", "sent to clients"];
  const filtered = logs.filter((l) => {
    const desc = (l.description || "").toLowerCase();
    const type = (l.actionType || "").toLowerCase();
    return keywords.some((k) => desc.includes(k) || type.includes(k));
  });

  const items = (filtered.length ? filtered : logs).slice(0, limitResults).map((l) => {
    const time = l.timestamp instanceof Date ? l.timestamp.toISOString().split("T")[0] : String(l.timestamp);
    return `- [${time}] ${l.projectName}: ${l.description}`;
  });

  return items.join("\n");
}

function formatProjectSummary(data: Record<string, unknown>): string {
  const lines: string[] = [];
  lines.push(`Project: ${String(data.name ?? "Unnamed")}`);
  if (data.clientName) lines.push(`Client: ${String(data.clientName)}`);
  if (data.siteManagerName) lines.push(`Site Manager: ${String(data.siteManagerName)}`);
  if (data.city) lines.push(`City: ${String(data.city)}`);
  if (data.address) lines.push(`Address: ${String(data.address)}`);
  if (data.clientPhone) lines.push(`Phone: ${String(data.clientPhone)}`);
  if (data.status) lines.push(`Status: ${String(data.status)}`);
  if (data.progress !== undefined) lines.push(`Progress: ${String(data.progress)}%`);
  if (data.amount !== undefined && data.amount !== null && data.amount !== "") {
    lines.push(`Amount: ${formatAmount(data.amount as number | string)}`);
  }

  // workflow
  if (Array.isArray(data.workflow)) {
    lines.push("Workflow:");
    for (const node of data.workflow as any[]) {
      if (!node || typeof node !== "object") continue;
      const title = node.title ?? node.key ?? "Unnamed step";
      const completed = node.completed ? "completed" : "pending";
      const amt = node.amount ?? node.value ?? null;
      lines.push(`- ${String(title)}: ${completed}${amt ? ` — amount: ${formatAmount(amt)}` : ""}`);
    }
  }

  return lines.join("\n");
}

function normalizeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !["the", "and", "for", "from", "with", "what", "who", "how", "much", "been"].includes(token));
}

function getAdvanceAmountFromWorkflow(workflow: unknown): number | string | null {
  if (!Array.isArray(workflow)) return null;

  for (const node of workflow) {
    if (!node || typeof node !== "object") continue;
    const workflowNode = node as {
      key?: string;
      title?: string;
      amount?: number | string | null;
      value?: unknown;
    };
    const key = String(workflowNode.key ?? "").toLowerCase();
    const title = String(workflowNode.title ?? "").toLowerCase();
    if (key !== "advance_received" && !title.includes("advance received")) continue;

    if (workflowNode.amount !== undefined && workflowNode.amount !== null && workflowNode.amount !== "") {
      return workflowNode.amount;
    }
    if (typeof workflowNode.value === "number" || typeof workflowNode.value === "string") {
      return workflowNode.value;
    }
  }

  return null;
}

function scoreProjectMatch(messageTokens: string[], data: Record<string, unknown>): number {
  const fields = [data.name, data.clientName, data.siteManagerName, data.address, data.city, data.landmark]
    .filter(Boolean)
    .map((value) => normalizeTokens(String(value)).join(" "));

  const haystack = normalizeTokens(fields.join(" "));
  const hayset = new Set(haystack);
  return messageTokens.reduce((score, token) => score + (hayset.has(token) ? 1 : 0), 0);
}

async function findBestProjectMatch(message: string): Promise<Record<string, unknown> | null> {
  const q = query(collection(db, "projects"), orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const messageTokens = normalizeTokens(message);
  let best: Record<string, unknown> | null = null;
  let bestScore = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data() as Record<string, unknown>;
    if (data.deleted) continue;
    const score = scoreProjectMatch(messageTokens, data);
    if (score > bestScore) {
      bestScore = score;
      best = data;
    }
  }

  return bestScore > 0 ? best : null;
}

function summarizeAdvanceFromWorkflow(workflow: unknown): string[] {
  if (!Array.isArray(workflow)) return [];

  const lines: string[] = [];
  for (const node of workflow) {
    if (!node || typeof node !== "object") continue;
    const workflowNode = node as {
      key?: string;
      title?: string;
      completed?: boolean;
      amount?: number | null;
      value?: unknown;
      notes?: string;
    };

    const key = String(workflowNode.key ?? "").toLowerCase();
    const title = String(workflowNode.title ?? "").toLowerCase();
    if (key !== "advance_received" && !title.includes("advance received")) continue;

    const amount = workflowNode.amount ?? (typeof workflowNode.value === "number" ? workflowNode.value : null);
    const status = workflowNode.completed ? "completed" : "pending";
    lines.push(`  Advance Received: ${amount !== null && amount !== undefined ? `₹${amount}` : "not recorded"} (${status})`);
    if (workflowNode.notes) lines.push(`  Advance Notes: ${workflowNode.notes}`);
  }

  return lines;
}

async function fetchAllProjects(message: string): Promise<string> {
  try {
    const q = query(collection(db, "projects"), orderBy("updatedAt", "desc"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return "No projects found in the database.";

    const lowerMessage = message.toLowerCase();
    const matchedDocs = snapshot.docs.filter((doc) => {
      const d = doc.data();
      const name = String(d.name ?? "").toLowerCase();
      const clientName = String(d.clientName ?? "").toLowerCase();
      return name && lowerMessage.includes(name) || clientName && lowerMessage.includes(clientName);
    });

    const docsToReport = matchedDocs.length > 0 ? matchedDocs : snapshot.docs;
    const lines: string[] = [matchedDocs.length > 0 ? "Matching Project Data:\n" : "Current Projects in Galaxy System:\n"];
    snapshot.docs.forEach((doc) => {
      if (matchedDocs.length > 0 && !docsToReport.includes(doc)) return;
      const d = doc.data();
      if (d.deleted) return;
      lines.push(`Project: ${d.name || "Unnamed"}`);
      if (d.clientName) lines.push(`  Client: ${d.clientName}`);
      if (d.city) lines.push(`  City: ${d.city}`);
      if (d.address) lines.push(`  Address: ${d.address}`);
      if (d.clientPhone) lines.push(`  Phone: ${d.clientPhone}`);
      if (d.status) lines.push(`  Status: ${d.status}`);
      if (d.progress !== undefined) lines.push(`  Progress: ${d.progress}%`);
      if (d.siteManagerName) lines.push(`  Site Manager: ${d.siteManagerName}`);
      if (d.startDate) lines.push(`  Start Date: ${d.startDate}`);
      if (d.amount !== undefined && d.amount !== null && d.amount !== "") {
        lines.push(`  Amount: ${typeof d.amount === "number" ? `₹${d.amount}` : d.amount}`);
      }
      lines.push(...summarizeAdvanceFromWorkflow(d.workflow));
      if (d.deadline) {
        const deadline = d.deadline?.toDate ? d.deadline.toDate().toLocaleDateString("en-IN") : d.deadline;
        lines.push(`  Deadline: ${deadline}`);
      }
      lines.push("");
    });
    return lines.join("\n");
  } catch {
    return "Unable to fetch project data at this time.";
  }
}

function formatAmount(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "not recorded";
  if (typeof value === "number") return `₹${value}`;
  return String(value);
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const primaryModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const fallbackModels = (process.env.GEMINI_FALLBACK_MODELS || "gemini-3.5-flash")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const modelsToTry = [primaryModel, ...fallbackModels.filter((m) => m !== primaryModel)];

    let dynamicContext = "";
    let source = "Galaxy SOP Knowledge Base";

    if (isAdvanceQuery(message)) {
      const project = await findBestProjectMatch(message);
      if (project) {
        const projectAmount = project.amount as number | string | null | undefined;
        const amount = projectAmount ?? getAdvanceAmountFromWorkflow(project.workflow);
        const projectName = String(project.name ?? "Unnamed");
        const clientName = String(project.clientName ?? "");

        if (amount !== null && amount !== undefined && amount !== "") {
          return NextResponse.json({
            answer: `${projectName}${clientName ? ` (${clientName})` : ""} advance amount: ${formatAmount(amount)}.`,
            source: "Live Project Data",
          });
        }

        return NextResponse.json({
          answer: `${projectName}${clientName ? ` (${clientName})` : ""} does not have an advance amount recorded yet.`,
          source: "Live Project Data",
        });
      }
    }

    if (isRecentSentQuery(message)) {
      try {
        const logs = await fetchAuditLogs();
        const body = formatAuditResults(logs, 10);
        return NextResponse.json({ answer: `Recent items sent to clients:\n${body}`, source: "Audit Logs" });
      } catch (e) {
        console.error("Failed to fetch audit logs for sent-items query:", e);
      }
    }

    if (isProjectDetailsQuery(message)) {
      const project = await findBestProjectMatch(message);
      if (project) {
        const summary = formatProjectSummary(project);
        return NextResponse.json({ answer: summary, source: "Live Project Data" });
      }
    }

    if (isProjectRelated(message)) {
      dynamicContext = await fetchAllProjects(message);
      source = "Galaxy SOP Knowledge Base + Live Project Data";
    }

    const systemPrompt = `You are SOP-Bot, an internal assistant for Galaxy Home Automation LLP — a home automation company in Mumbai working exclusively with Zigbee protocol. You help staff answer questions about company SOPs, pricing, warranties, installation procedures, and live project data.

Always be concise, accurate, and professional. If you don't know something, say so clearly.

${GALAXY_STATIC_CONTEXT}

${dynamicContext ? `\n---\nLIVE PROJECT DATA (fetched in real-time):\n${dynamicContext}` : ""}`;

    async function generateWithRetry(modelRef: any, prompts: any[], maxAttempts = 3) {
      let attempt = 0;
      while (attempt < maxAttempts) {
        try {
          return await modelRef.generateContent(prompts);
        } catch (err: any) {
          attempt++;
          const errMsg = err?.message || String(err);
          // If model not found or unsupported, fail fast
          if (errMsg.includes("404") || /not found/i.test(errMsg)) throw err;
          if (attempt >= maxAttempts) throw err;
          const delay = 500 * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    const prompts = [
      { text: systemPrompt },
      { text: `User question: ${message}` },
    ];

    let result: any = null;
    let usedModel: string | null = null;

    for (const modelName of modelsToTry) {
      const modelRef = genAI.getGenerativeModel({ model: modelName });
      try {
        result = await generateWithRetry(modelRef, prompts);
        usedModel = modelName;
        break;
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (/not found|404/i.test(msg)) {
          continue; // try next fallback model
        }
        throw err;
      }
    }

    if (!result) {
      return NextResponse.json({ error: "All configured Gemini models failed or were not found" }, { status: 502 });
    }

    const answer = result.response?.text ? result.response.text() : String(result);

    return NextResponse.json({ answer, source });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
