// ─── Types ────────────────────────────────────────────────────────────────────

export interface Quote {
  id: string
  quoteNumber: string | number
  createdAt: string
  [key: string]: unknown
}

export interface Product {
  id: string
  active?: boolean
  custom?: boolean
  [key: string]: unknown
}

// ─── Re-export Firestore implementations ─────────────────────────────────────

export {
  getAllQuotesFromFirestore       as getAllQuotes,
  getQuoteByIdFromFirestore       as getQuoteById,
  saveQuoteToFirestore            as saveQuote,
  deleteQuoteFromFirestore        as deleteQuote,
  duplicateQuoteInFirestore       as duplicateQuote,
  getAllProductsFromFirestore      as getAllProducts,
  getProductByIdFromFirestore     as getProductById,
  saveProductToFirestore          as saveProduct,
  deleteProductFromFirestore      as deleteProduct,
  toggleProductActiveInFirestore  as toggleProductActive,
  seedProductsInFirestore         as seedProducts,
} from '@/lib/firestore/quotes'

// Legacy compat
import { getAllProductsFromFirestore, saveProductToFirestore, deleteProductFromFirestore } from '@/lib/firestore/quotes'

export const getCustomProducts   = () => getAllProductsFromFirestore().then(ps => ps.filter(p => p.custom))
export const saveCustomProduct   = (product: Product) => saveProductToFirestore({ ...product, custom: true })
export const deleteCustomProduct = (id: string) => deleteProductFromFirestore(id)
