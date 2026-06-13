import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Menu, Bell, User, Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const BREADCRUMBS = {
  '/':             [{ label: 'Dashboard' }],
  '/new-quote':    [{ label: 'Dashboard', to: '/' }, { label: 'New Quote' }],
  '/saved-quotes': [{ label: 'Dashboard', to: '/' }, { label: 'Saved Quotes' }],
  '/products':     [{ label: 'Dashboard', to: '/' }, { label: 'Products' }],
  '/catalog':      [{ label: 'Dashboard', to: '/' }, { label: 'Catalog' }],
}

const getBreadcrumbs = (pathname) => {
  if (BREADCRUMBS[pathname]) return BREADCRUMBS[pathname]
  if (pathname.includes('/edit')) return [
    { label: 'Dashboard', to: '/' },
    { label: 'Saved Quotes', to: '/saved-quotes' },
    { label: 'Edit Quote' },
  ]
  if (pathname.includes('/boq')) return [
    { label: 'Dashboard', to: '/' },
    { label: 'Saved Quotes', to: '/saved-quotes' },
    { label: 'BOQ Preview' },
  ]
  return [{ label: 'Dashboard', to: '/' }]
}

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation()
  const { dark, toggle } = useTheme()
  const crumbs = getBreadcrumbs(pathname)

  return (
    <header
      className="h-14 flex items-center justify-between px-5 shrink-0"
      style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left: menu + breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--gold)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav className="flex items-center gap-1.5 text-xs">
          {crumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <span style={{ color: 'var(--text-faint)' }}>/</span>
              )}
              {crumb.to ? (
                <Link to={crumb.to}
                  className="transition-colors font-medium"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--gold)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-1.5">

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={dark ? 'Switch to Light' : 'Switch to Dark'}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
          style={{
            border: '1px solid var(--border)',
            color: 'var(--gold)',
            background: 'var(--bg-surface2)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--gold)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          {/* Toggle pill */}
          <span className="relative w-8 h-4 rounded-full transition-colors"
            style={{ background: dark ? 'var(--gold)' : 'rgba(201,168,64,0.2)', border: '1px solid rgba(201,168,64,0.3)' }}>
            <span className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300"
              style={{ left: dark ? '17px' : '1px' }} />
          </span>
          {dark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
            {dark ? 'Dark' : 'Light'}
          </span>
        </button>

        {/* Bell */}
        <button
          className="p-2 rounded-xl transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--gold)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* User */}
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all"
          style={{ border: '1px solid transparent' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(201,168,64,0.2)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent' }}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center"
               style={{ background: 'rgba(201,168,64,0.12)', border: '1px solid rgba(201,168,64,0.2)' }}>
            <User className="w-3.5 h-3.5" style={{ color: 'var(--gold)' }} />
          </div>
          <span className="text-sm font-semibold hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>
            Admin
          </span>
        </div>
      </div>
    </header>
  )
}
