import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const API_SECRET = process.env.SITE_UPDATES_API_SECRET;

export async function POST(req: NextRequest) {
  // API key check
  const authHeader = req.headers.get("x-api-key");
  if (!API_SECRET || authHeader !== API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { workerName, siteId, status, photoUrl, notes } = body as Record<string, unknown>;

  if (!workerName || !siteId || !status) {
    return NextResponse.json(
      { error: "workerName, siteId, and status are required" },
      { status: 400 }
    );
  }

  const now = FieldValue.serverTimestamp();

  // Write to siteReports
  const reportRef = await adminDb.collection("siteReports").add({
    siteId,
    workerId: "whatsapp-bot",
    workerName,
    workCompleted: status === "DONE" ? (notes ?? "") : "",
    pendingWork: status === "GOT IT" ? (notes ?? "") : "",
    issues: "",
    clientRequests: "",
    notes: notes ?? "",
    photoUrl: photoUrl ?? null,
    source: "whatsapp",
    createdAt: now,
  });

  // Write to siteTimeline
  await adminDb.collection("siteTimeline").add({
    siteId,
    action: `Worker Check-in: ${status}`,
    description: `${workerName} sent status "${status}"${notes ? ` — ${notes}` : ""}`,
    userId: "whatsapp-bot",
    userName: workerName,
    timestamp: now,
  });

  return NextResponse.json({ success: true, reportId: reportRef.id }, { status: 200 });
}
