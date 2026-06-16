import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type { SiteAssignment, SitePhoto, SiteTimelineEntry, SiteReport, VoiceReport, SiteStatus, GeneratedReport } from "@/types/site";

// ── Site Assignments ────────────────────────────────────────────────────────

export function subscribeToAllSiteAssignments(
  callback: (assignments: SiteAssignment[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, "siteAssignments"), (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SiteAssignment));
    data.sort((a, b) => {
      const aTime = a.createdAt ? (a.createdAt as unknown as { toDate: () => Date }).toDate().getTime() : 0;
      const bTime = b.createdAt ? (b.createdAt as unknown as { toDate: () => Date }).toDate().getTime() : 0;
      return bTime - aTime;
    });
    callback(data);
  }, (error) => {
    console.error("subscribeToAllSiteAssignments error:", error.code, error.message);
  });
}

export function subscribeToMySiteAssignments(
  uid: string,
  callback: (assignments: SiteAssignment[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "siteAssignments"),
    where("assignedTo", "==", uid)
  );
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SiteAssignment));
    data.sort((a, b) => {
      const aTime = a.createdAt ? (a.createdAt as unknown as { toDate: () => Date }).toDate().getTime() : 0;
      const bTime = b.createdAt ? (b.createdAt as unknown as { toDate: () => Date }).toDate().getTime() : 0;
      return bTime - aTime;
    });
    callback(data);
  }, (error) => {
    console.error("subscribeToMySiteAssignments error:", error.code, error.message);
    onError?.(error);
  });
}

export async function createSiteAssignment(
  data: Omit<SiteAssignment, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const docRef = await addDoc(collection(db, "siteAssignments"), {
    ...data,
    status: "Assigned",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await addTimelineEntry(docRef.id, {
    action: "Assignment Created",
    description: `Site assigned to ${data.assignedToName}`,
    userId: data.assignedBy,
    userName: data.assignedByName,
  });

  return docRef.id;
}

export async function updateSiteAssignment(
  id: string,
  data: Partial<Omit<SiteAssignment, "id" | "createdAt">>,
  userId?: string,
  userName?: string
): Promise<void> {
  await updateDoc(doc(db, "siteAssignments", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
  if (userId && userName) {
    await addTimelineEntry(id, {
      action: "Assignment Updated",
      description: "Assignment details updated",
      userId,
      userName,
    });
  }
}

export async function updateSiteStatus(
  id: string,
  status: SiteStatus,
  userId: string,
  userName: string
): Promise<void> {
  await updateDoc(doc(db, "siteAssignments", id), {
    status,
    updatedAt: serverTimestamp(),
  });

  await addTimelineEntry(id, {
    action: "Status Changed",
    description: `Status updated to "${status}"`,
    userId,
    userName,
  });
}

// ── Timeline ────────────────────────────────────────────────────────────────

export async function addTimelineEntry(
  siteId: string,
  entry: { action: string; description: string; userId: string; userName: string }
): Promise<void> {
  await addDoc(collection(db, "siteTimeline"), {
    siteId,
    ...entry,
    timestamp: serverTimestamp(),
  });
}

export function subscribeToSiteTimeline(
  siteId: string,
  callback: (entries: SiteTimelineEntry[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "siteTimeline"),
    where("siteId", "==", siteId),
    orderBy("timestamp", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SiteTimelineEntry)));
  });
}

// ── Photos ──────────────────────────────────────────────────────────────────

export async function uploadSitePhoto(
  siteId: string,
  file: File,
  category: SitePhoto["category"],
  userId: string,
  userName: string
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const storageRef = ref(storage, `site-photos/${siteId}/${Date.now()}.${ext}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  await addDoc(collection(db, "sitePhotos"), {
    siteId,
    uploadedBy: userId,
    uploadedByName: userName,
    category,
    imageUrl: url,
    timestamp: serverTimestamp(),
  });

  await addTimelineEntry(siteId, {
    action: "Photo Uploaded",
    description: `${category} photo uploaded by ${userName}`,
    userId,
    userName,
  });

  return url;
}

export function subscribeToSitePhotos(
  siteId: string,
  callback: (photos: SitePhoto[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "sitePhotos"),
    where("siteId", "==", siteId),
    orderBy("timestamp", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SitePhoto)));
  });
}

// ── Written Reports ──────────────────────────────────────────────────────────

export async function submitSiteReport(
  siteId: string,
  data: {
    workerId: string;
    workerName: string;
    workCompleted: string;
    pendingWork: string;
    issues: string;
    clientRequests: string;
    notes: string;
  }
): Promise<string> {
  const docRef = await addDoc(collection(db, "siteReports"), {
    siteId,
    ...data,
    createdAt: serverTimestamp(),
  });

  await addTimelineEntry(siteId, {
    action: "Report Submitted",
    description: `Written report submitted by ${data.workerName}`,
    userId: data.workerId,
    userName: data.workerName,
  });

  return docRef.id;
}

export function subscribeToSiteReports(
  siteId: string,
  callback: (reports: SiteReport[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "siteReports"),
    where("siteId", "==", siteId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SiteReport)));
  });
}

// ── Voice Reports ────────────────────────────────────────────────────────────

export async function uploadVoiceReport(
  siteId: string,
  audioBlob: Blob,
  userId: string,
  userName: string,
  transcript: string,
  generatedReport: GeneratedReport | null
): Promise<string> {
  const storageRef = ref(storage, `voice-reports/${siteId}/${Date.now()}.webm`);
  await uploadBytes(storageRef, audioBlob);
  const audioUrl = await getDownloadURL(storageRef);

  const docRef = await addDoc(collection(db, "voiceReports"), {
    siteId,
    workerId: userId,
    workerName: userName,
    audioUrl,
    transcript,
    generatedReport,
    createdAt: serverTimestamp(),
  });

  await addTimelineEntry(siteId, {
    action: "Voice Report Submitted",
    description: `Voice report submitted by ${userName}`,
    userId,
    userName,
  });

  return docRef.id;
}

export function subscribeToVoiceReports(
  siteId: string,
  callback: (reports: VoiceReport[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "voiceReports"),
    where("siteId", "==", siteId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as VoiceReport)));
  });
}

// ── Workers list ─────────────────────────────────────────────────────────────

export async function getSiteWorkers(): Promise<{ uid: string; name: string }[]> {
  const snap = await getDocs(
    query(collection(db, "authorized_users"), where("role", "==", "site_worker"))
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return { uid: d.id, name: data.name || data.displayName || data.email || d.id };
  });
}
