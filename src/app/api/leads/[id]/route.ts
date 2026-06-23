import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing lead id" }, { status: 400 });
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await getAuth().verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const userDoc = await adminDb.collection("authorized_users").doc(uid).get();
  const userData = userDoc.data();
  if (!userData?.active || (userData.role !== "admin" && userData.role !== "owner")) {
    return NextResponse.json({ error: "Forbidden: admin or owner role required" }, { status: 403 });
  }

  await adminDb.collection("leads").doc(id).delete();

  return NextResponse.json({ success: true });
}
