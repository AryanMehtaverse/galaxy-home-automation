"use client"

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import type { Lead, CallLog } from '@/types/lead'
import { fetchLeads, fetchCallLogs } from '@/lib/leadsService'
import { SAMPLE_LEADS, SAMPLE_CALL_LOGS } from '@/data/sampleLeads'

const GOLD = '#C9A840'
const COLORS = ['#C9A840', '#60a5fa', '#a78bfa', '#34d399', '#f97316', '#f43f5e', '#818cf8', '#10b981', '#6b7280', '#ef4444']

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#C9A840]">{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  )
}

const tooltipStyle = {
  contentStyle: { background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, color: '#e4e4e7', fontSize: 12 },
  itemStyle: { color: '#e4e4e7' },
  labelStyle: { color: '#a1a1aa' },
}

export default function AnalyticsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [l, c] = await Promise.all([fetchLeads(), fetchCallLogs()])
      setLeads(l.length ? l : SAMPLE_LEADS)
      setCallLogs(c.length ? c : SAMPLE_CALL_LOGS)
    } catch {
      setLeads(SAMPLE_LEADS)
      setCallLogs(SAMPLE_CALL_LOGS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-[#C9A840]" />
      </div>
    )
  }

  const total = leads.length
  const won = leads.filter((l) => l.status === 'Won').length
  const lost = leads.filter((l) => l.status === 'Lost').length
  const conversionRate = total > 0 ? ((won / total) * 100).toFixed(1) : '0'

  // Leads by status
  const statusMap: Record<string, number> = {}
  leads.forEach((l) => { statusMap[l.status] = (statusMap[l.status] || 0) + 1 })
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  // Leads by source
  const sourceMap: Record<string, number> = {}
  leads.forEach((l) => { sourceMap[l.source] = (sourceMap[l.source] || 0) + 1 })
  const sourceData = Object.entries(sourceMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  // Leads added over last 30 days
  const last30: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    last30[key] = 0
  }
  leads.forEach((l) => { if (last30[l.createdAt] !== undefined) last30[l.createdAt]++ })
  const lineData = Object.entries(last30).map(([date, count]) => ({
    date: date.slice(5), // MM-DD
    count,
  }))

  // Calls per week (last 8 weeks)
  const weekMap: Record<string, number> = {}
  callLogs.forEach((c) => {
    const d = new Date(c.date)
    const week = getWeekLabel(d)
    weekMap[week] = (weekMap[week] || 0) + 1
  })
  const callWeekData = Object.entries(weekMap)
    .sort((a, b) => a[0] > b[0] ? 1 : -1)
    .slice(-8)
    .map(([week, calls]) => ({ week, calls }))

  return (
    <div className="min-h-screen bg-zinc-950 p-3 sm:p-6">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Lead Analytics</h1>
            <p className="mt-1 text-sm text-zinc-500">Performance overview and trends</p>
          </div>
          <Link href="/leads">
            <button className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors">
              ← All Leads
            </button>
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Leads" value={total} />
          <StatCard label="Won" value={won} sub="Closed successfully" />
          <StatCard label="Lost" value={lost} sub="Did not convert" />
          <StatCard label="Conversion Rate" value={`${conversionRate}%`} sub={`${won} of ${total} leads`} />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Leads by Status */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="mb-4 text-sm font-semibold text-zinc-300">Leads by Status</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusData} margin={{ top: 0, right: 10, left: -10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" name="Leads" fill={GOLD} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Leads by Source */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="mb-4 text-sm font-semibold text-zinc-300">Leads by Source</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {sourceData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#71717a' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Leads added over last 30 days */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="mb-4 text-sm font-semibold text-zinc-300">Leads Added — Last 30 Days</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} interval={4} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="count" name="Leads" stroke={GOLD} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Calls per week */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="mb-4 text-sm font-semibold text-zinc-300">Calls per Week</h3>
            {callWeekData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-zinc-600 text-sm">No call data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={callWeekData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="week" tick={{ fill: '#71717a', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="calls" name="Calls" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getWeekLabel(date: Date): string {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay()) // Start of week (Sunday)
  return d.toISOString().split('T')[0]
}
