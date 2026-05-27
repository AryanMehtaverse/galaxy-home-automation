import {
  collection,
  collectionGroup,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export interface AuditLog {
  id: string;
  projectId: string;
  projectName: string;
  timestamp: Date;
  actionType: string;
  description: string;
  stepName?: string | null;
  userName: string;
  userEmail: string;
  userUid: string;
}

/**
 * Writes an activity log to the audit_logs subcollection of a specific project.
 */
export async function writeAuditLog(
  projectId: string,
  actionType: string,
  description: string,
  stepName?: string | null
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const logData = {
    timestamp: Timestamp.now(),
    actionType,
    description,
    stepName: stepName ?? null,
    userUid: currentUser.uid,
    userName: currentUser.displayName || currentUser.email || "Unknown User",
    userEmail: currentUser.email || "",
  };

  try {
    await addDoc(collection(db, "projects", projectId, "audit_logs"), logData);
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

/**
 * Fetches activity logs across all projects.
 * Uses Firestore Collection Group query when indexed, and falls back to concurrent subcollection fetching for bulletproof zero-setup operation.
 */
export async function fetchAuditLogs(): Promise<AuditLog[]> {
  try {
    // 1. Fetch all projects once to map IDs to project Names (extremely fast)
    const projectsSnapshot = await getDocs(collection(db, "projects"));
    const projectsMap: Record<string, string> = {};
    projectsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      projectsMap[doc.id] = data.name ?? "Unknown Project";
    });

    // 2. Try the high-performance Collection Group query
    try {
      const q = query(
        collectionGroup(db, "audit_logs"),
        orderBy("timestamp", "desc"),
        limit(150)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        const pathParts = doc.ref.path.split("/");
        const projectId = pathParts[1] || "";
        
        let timestamp: Date;
        if (data.timestamp && typeof data.timestamp === "object" && "toDate" in data.timestamp) {
          timestamp = (data.timestamp as { toDate: () => Date }).toDate();
        } else if (typeof data.timestamp === "string") {
          timestamp = new Date(data.timestamp);
        } else {
          timestamp = new Date();
        }

        return {
          id: doc.id,
          projectId,
          projectName: projectsMap[projectId] || "Deleted Project",
          timestamp,
          actionType: String(data.actionType ?? "unknown"),
          description: String(data.description ?? ""),
          stepName: data.stepName ? String(data.stepName) : null,
          userName: String(data.userName ?? data.userEmail ?? "Unknown User"),
          userEmail: String(data.userEmail ?? ""),
          userUid: String(data.userUid ?? ""),
        };
      });
    } catch (groupError) {
      console.warn(
        "CollectionGroup query failed (possibly missing index). Falling back to concurrent project subcollection fetches.",
        groupError
      );

      // Fallback: Fetch logs concurrently from each active project's subcollection
      const allLogsPromises = projectsSnapshot.docs.map(async (projectDoc) => {
        const logsRef = collection(db, "projects", projectDoc.id, "audit_logs");
        const logsSnapshot = await getDocs(query(logsRef, orderBy("timestamp", "desc"), limit(50)));
        
        return logsSnapshot.docs.map((doc) => {
          const data = doc.data();
          
          let timestamp: Date;
          if (data.timestamp && typeof data.timestamp === "object" && "toDate" in data.timestamp) {
            timestamp = (data.timestamp as { toDate: () => Date }).toDate();
          } else if (typeof data.timestamp === "string") {
            timestamp = new Date(data.timestamp);
          } else {
            timestamp = new Date();
          }

          return {
            id: doc.id,
            projectId: projectDoc.id,
            projectName: projectsMap[projectDoc.id] || "Unknown Project",
            timestamp,
            actionType: String(data.actionType ?? "unknown"),
            description: String(data.description ?? ""),
            stepName: data.stepName ? String(data.stepName) : null,
            userName: String(data.userName ?? data.userEmail ?? "Unknown User"),
            userEmail: String(data.userEmail ?? ""),
            userUid: String(data.userUid ?? ""),
          };
        });
      });

      const nestedLogs = await Promise.all(allLogsPromises);
      return nestedLogs
        .flat()
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 150);
    }
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return [];
  }
}
