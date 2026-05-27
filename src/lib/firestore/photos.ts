import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";

export interface ProjectPhoto {
  id: string;
  imageUrl: string;
  uploadedAt: Timestamp;
  fileName: string;
  storagePath: string;
  caption?: string;
}

const COLLECTION_PROJECTS = "projects";
const SUBCOLLECTION_PHOTOS = "photos";

/**
 * Subscribes to real-time changes of photos inside a project
 */
export function subscribeToProjectPhotos(
  projectId: string,
  callback: (photos: ProjectPhoto[]) => void
): Unsubscribe {
  const photosRef = collection(db, COLLECTION_PROJECTS, projectId, SUBCOLLECTION_PHOTOS);
  const q = query(photosRef, orderBy("uploadedAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    const photos: ProjectPhoto[] = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        imageUrl: data.imageUrl || "",
        uploadedAt: data.uploadedAt,
        fileName: data.fileName || "",
        storagePath: data.storagePath || "",
        caption: data.caption || "",
      };
    });
    callback(photos);
  });
}

/**
 * Uploads a file to Firebase Storage and registers it in Firestore
 */
export async function uploadProjectPhoto(
  projectId: string,
  file: File,
  caption: string = ""
): Promise<string> {
  const uniqueId = Math.random().toString(36).substring(2, 9) + "_" + Date.now();
  const fileExtension = file.name.split(".").pop();
  const storageFileName = `${uniqueId}.${fileExtension}`;
  const storagePath = `projects/${projectId}/photos/${storageFileName}`;

  // 1. Upload to Firebase Storage
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);

  // 2. Get Download URL
  const imageUrl = await getDownloadURL(storageRef);

  // 3. Write Firestore metadata
  const photosRef = collection(db, COLLECTION_PROJECTS, projectId, SUBCOLLECTION_PHOTOS);
  const docRef = await addDoc(photosRef, {
    imageUrl,
    uploadedAt: Timestamp.now(),
    fileName: file.name,
    storagePath,
    caption,
  });

  return docRef.id;
}

/**
 * Deletes a photo from both Firebase Storage and Firestore
 */
export async function deleteProjectPhoto(
  projectId: string,
  photoId: string,
  storagePath: string
): Promise<void> {
  // 1. Delete from Firebase Storage
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.warn("Storage deletion failed or file did not exist:", error);
  }

  // 2. Delete Firestore document
  const docRef = doc(db, COLLECTION_PROJECTS, projectId, SUBCOLLECTION_PHOTOS, photoId);
  await deleteDoc(docRef);
}

/**
 * Updates a photo caption in Firestore
 */
export async function updatePhotoCaption(
  projectId: string,
  photoId: string,
  caption: string
): Promise<void> {
  const docRef = doc(db, COLLECTION_PROJECTS, projectId, SUBCOLLECTION_PHOTOS, photoId);
  await updateDoc(docRef, { caption });
}
