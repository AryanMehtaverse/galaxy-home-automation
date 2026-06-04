import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function generateUniqueAccessCode(): Promise<string> {
  const projectsRef = collection(db, "projects");
  let attempts = 0;
  
  while (attempts < 100) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // 1000 to 9999
    const code = `PRJ-${randomDigits}`;
    
    // Check if code already exists
    const q = query(projectsRef, where("clientAccessCode", "==", code), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return code;
    }
    attempts++;
  }
  
  throw new Error("Failed to generate a unique access code after many attempts");
}
