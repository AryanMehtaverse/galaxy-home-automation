import React from 'react'
import { cn } from '../../utils/cn'

export function TabBar({ tabs, activeTab, onChange }) {
  return (
    <div className="flex border-b border-galaxy-200 bg-white">
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors focus:outline-none',
            activeTab === tab.id
              ? 'text-galaxy-700 border-b-2 border-galaxy-600 -mb-px bg-white'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
          <span className="hidden sm:inline">{tab.label}</span>
          <span className="sm:hidden">{i + 1}</span>
          {tab.badge != null && tab.badge > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-galaxy-100 text-galaxy-700">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
