import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Quote, Product } from "@/services/storageService";

const QUOTES_COL = "quotes";
const PRODUCTS_COL = "products";

// ── Quotes ────────────────────────────────────────────────────────────────────

export async function getAllQuotesFromFirestore(): Promise<Quote[]> {
  const snap = await getDocs(query(collection(db, QUOTES_COL), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Quote, "id">), id: d.id }));
}

export async function getQuoteByIdFromFirestore(id: string): Promise<Quote> {
  const snap = await getDoc(doc(db, QUOTES_COL, id));
  if (!snap.exists()) throw new Error(`Quote ${id} not found`);
  return { ...(snap.data() as Omit<Quote, "id">), id: snap.id };
}

export async function saveQuoteToFirestore(quote: Quote): Promise<unknown> {
  const { id, ...data } = quote;
  await setDoc(doc(db, QUOTES_COL, id), data);
  return quote;
}

export async function deleteQuoteFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, QUOTES_COL, id));
}

export async function duplicateQuoteInFirestore(id: string, newNumber: string | number): Promise<Quote> {
  const original = await getQuoteByIdFromFirestore(id);
  const newQuote: Quote = {
    ...original,
    id: crypto.randomUUID(),
    quoteNumber: newNumber,
    createdAt: new Date().toISOString(),
  };
  await saveQuoteToFirestore(newQuote);
  return newQuote;
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function getAllProductsFromFirestore(): Promise<Product[]> {
  const snap = await getDocs(collection(db, PRODUCTS_COL));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Product, "id">), id: d.id }));
}

export async function getProductByIdFromFirestore(id: string): Promise<Product> {
  const snap = await getDoc(doc(db, PRODUCTS_COL, id));
  if (!snap.exists()) throw new Error(`Product ${id} not found`);
  return { ...(snap.data() as Omit<Product, "id">), id: snap.id };
}

export async function saveProductToFirestore(product: Product): Promise<unknown> {
  const { id, ...data } = product;
  await setDoc(doc(db, PRODUCTS_COL, id), data);
  return product;
}

export async function deleteProductFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, PRODUCTS_COL, id));
}

export async function toggleProductActiveInFirestore(id: string): Promise<Product> {
  const product = await getProductByIdFromFirestore(id);
  const updated: Product = { ...product, active: !product.active };
  await setDoc(doc(db, PRODUCTS_COL, id), updated);
  return updated;
}

export async function seedProductsInFirestore(catalogProducts: Product[]): Promise<void> {
  const existing = await getDocs(collection(db, PRODUCTS_COL));
  if (!existing.empty) return;
  for (const p of catalogProducts) {
    await saveProductToFirestore(p);
  }
}

// ── Migration helpers (preserve original IDs) ─────────────────────────────────

export async function migrateQuoteToFirestore(quote: Quote): Promise<void> {
  const { id, ...data } = quote;
  await setDoc(doc(db, QUOTES_COL, id), data);
}

export async function migrateProductToFirestore(product: Product): Promise<void> {
  const { id, ...data } = product;
  await setDoc(doc(db, PRODUCTS_COL, id), data);
}
