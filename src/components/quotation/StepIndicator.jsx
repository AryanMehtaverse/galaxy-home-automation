import React from 'react'
import { Check } from 'lucide-react'

export default function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const num = i + 1
        const done = num < current
        const active = num === current

        return (
          <React.Fragment key={step}>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  done
                    ? 'bg-galaxy-600 text-white'
                    : active
                    ? 'bg-galaxy-600 text-white ring-4 ring-galaxy-100'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : num}
              </div>
              <span
                className={`text-sm font-medium hidden sm:block ${
                  active ? 'text-galaxy-700' : done ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${num < current ? 'bg-galaxy-500' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
