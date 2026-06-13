import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FilePlus, FolderOpen, Package, BookOpen,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

const NAV = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard',    end: true },
  { to: '/new-quote',    icon: FilePlus,        label: 'New Quote'              },
  { to: '/saved-quotes', icon: FolderOpen,      label: 'Saved Quotes'           },
  { to: '/products',     icon: Package,         label: 'Products'               },
  { to: '/catalog',      icon: BookOpen,        label: 'Catalog'                },
]

export default function Sidebar({ open, onToggle }) {
  return (
    <aside
      style={{ backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid rgba(201,168,64,0.1)' }}
      className={`relative flex flex-col transition-all duration-300 ${open ? 'w-60' : 'w-16'} shrink-0`}
    >
      {/* Logo */}
      <div className={`flex items-center shrink-0 ${open ? 'px-5 py-5' : 'px-2 py-5 justify-center'}`}
           style={{ borderBottom: '1px solid rgba(201,168,64,0.08)' }}>
        {open ? (
          <div className="flex items-center gap-3 w-full">
            <img
              src="/images/galaxy-logo.png"
              alt="Galaxy"
              className="h-9 w-auto object-contain shrink-0"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <div className="min-w-0">
              <p className="font-black text-sm tracking-widest leading-tight"
                 style={{ color: 'var(--sidebar-active)', letterSpacing: '0.15em' }}>
                GALAXY
              </p>
              <p className="text-[9px] font-medium tracking-[0.2em] uppercase"
                 style={{ color: 'var(--sidebar-muted)' }}>
                Wings of Future
              </p>
            </div>
          </div>
        ) : (
          <img src="/images/galaxy-logo.png" alt="Galaxy"
               className="h-8 w-8 object-contain"
               onError={(e) => { e.target.style.display = 'none' }} />
        )}
      </div>

      {/* Section label */}
      {open && (
        <div className="px-5 pt-5 pb-2">
          <p className="text-[9px] font-bold tracking-[0.25em] uppercase"
             style={{ color: 'var(--sidebar-muted)' }}>
            Menu
          </p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={!open ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium relative overflow-hidden ${
                isActive ? '' : 'hover:text-white'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: 'linear-gradient(135deg, rgba(201,168,64,0.18) 0%, rgba(201,168,64,0.08) 100%)',
                    color: 'var(--sidebar-active)',
                    border: '1px solid rgba(201,168,64,0.2)',
                  }
                : {
                    color: 'var(--sidebar-text)',
                    border: '1px solid transparent',
                  }
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {open && <span className="truncate">{label}</span>}
                {isActive && open && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full"
                        style={{ background: 'var(--gold)' }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-[68px] w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all"
        style={{
          background: 'var(--sidebar-bg)',
          border: '1px solid rgba(201,168,64,0.25)',
          color: 'var(--sidebar-active)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--gold)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(201,168,64,0.25)'}
      >
        {open ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {/* Footer */}
      {open && (
        <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(201,168,64,0.08)' }}>
          <p className="text-[10px]" style={{ color: 'var(--sidebar-muted)' }}>
            v2.0 · Quotation System
          </p>
        </div>
      )}
    </aside>
  )
}
