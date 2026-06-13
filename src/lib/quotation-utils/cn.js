/**
 * Lightweight classnames helper (no external dep)
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
