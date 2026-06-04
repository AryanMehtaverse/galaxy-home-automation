import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Generates a unique client access code in the standardized format:
 * GHA-YY-NNN
 * Where:
 * - GHA = Galaxy Home Automation
 * - YY = current year (last two digits)
 * - NNN = sequential project number padded to 3 digits (finds highest sequence and increments)
 */
export async function generateUniqueAccessCode(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const YY = String(currentYear).slice(-2); // last two digits of the year (e.g., "26" for 2026)

  const projectsRef = collection(db, "projects");
  const snapshot = await getDocs(projectsRef);

  let maxSeq = 0;
  // Match GHA-YY-NNN or GHA-YY-NNNN (supporting any number of digits in group)
  const regex = /^GHA-\d{2}-(\d+)$/;

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.clientAccessCode) {
      const match = String(data.clientAccessCode).match(regex);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  });

  const nextSeq = maxSeq + 1;
  // Pad to at least 3 digits (e.g., "001", "017", "125")
  const paddedSeq = String(nextSeq).padStart(3, "0");
  
  return `GHA-${YY}-${paddedSeq}`;
}
