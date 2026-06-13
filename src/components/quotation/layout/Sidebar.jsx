import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FilePlus, FolderOpen, Package, BookOpen, Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/new-quote', icon: FilePlus, label: 'New Quote' },
  { to: '/saved-quotes', icon: FolderOpen, label: 'Saved Quotes' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/catalog', icon: BookOpen, label: 'Catalog' },
]

export default function Sidebar({ open, onToggle }) {
  const { dark, toggle } = useTheme()
  return (
    <aside style={{
      width: '64px',
      background: 'var(--nav-bg)',
      borderRight: '1px solid rgba(255,255,255,0.04)',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: '12px',
      paddingBottom: '12px',
      gap: '4px',
    }}>
      {/* Logo mark */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px',
        background: 'var(--accent)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', marginBottom: '16px', flexShrink: 0,
      }}>
        <span style={{ color: 'white', fontWeight: 900, fontSize: '14px', letterSpacing: '-0.5px' }}>G</span>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', padding: '0 8px' }}>
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={label}
            className="nav-rail-link"
          >
            <Icon style={{ width: '18px', height: '18px' }} />
          </NavLink>
        ))}
      </nav>

      {/* Theme toggle at bottom */}
      <button
        onClick={toggle}
        title={dark ? 'Switch to Light' : 'Switch to Dark'}
        style={{
          width: '40px', height: '40px', borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--nav-text)', background: 'transparent',
          border: 'none', cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--nav-hover)'; e.currentTarget.style.color = '#A78BFA' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--nav-text)' }}
      >
        {dark ? <Sun style={{ width: '16px', height: '16px' }} /> : <Moon style={{ width: '16px', height: '16px' }} />}
      </button>
    </aside>
  )
}
