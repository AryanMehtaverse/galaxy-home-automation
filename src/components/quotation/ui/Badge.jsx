import React from 'react'

const VARIANTS = {
  default: 'bg-slate-100 text-slate-600',
  primary: 'bg-galaxy-100 text-galaxy-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
}

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  )
}
