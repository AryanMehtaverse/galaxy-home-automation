"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuthContext } from "@/components/providers/AuthProvider";

const TEAM = [
  { name: "Aryan Mehta", role: "Founder & CEO" },
  { name: "Manan Shah", role: "Site Operations Lead" },
  { name: "Rahul Verma", role: "Field Technician" },
  { name: "Karan Patel", role: "Field Technician" },
  { name: "Dev Joshi", role: "Project Manager" },
  { name: "Nikhil Rao", role: "BD Executive" },
  { name: "Siddharth Kumar", role: "Accounts" },
  { name: "Rohan Desai", role: "Field Technician" },
  { name: "Priya Sharma", role: "Business Development" },
  { name: "Sneha Gupta", role: "Operations Coordinator" },
];

const VALUES = [
  {
    icon: "⚡",
    title: "Speed & Precision",
    desc: "We deliver smart home solutions with zero compromise on quality or timelines.",
  },
  {
    icon: "🤝",
    title: "Client First",
    desc: "Every decision we make starts with what's best for the homeowner.",
  },
  {
    icon: "🔧",
    title: "End-to-End Service",
    desc: "From consultation to installation and beyond — we own the full journey.",
  },
  {
    icon: "🌐",
    title: "Future-Ready Tech",
    desc: "We integrate only the best and most forward-compatible automation systems.",
  },
];

export default function HomePage() {
  const { user } = useAuthContext();
  const firstName = user?.displayName?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-16">

      {/* Hero */}
      <section className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <Image
            src="/Galaxy Logo no bg.jpeg"
            alt="Galaxy Home Automation"
            width={72}
            height={72}
            className="rounded-xl object-contain"
            unoptimized
          />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Galaxy Home Automation
        </h1>
        <p className="text-lg text-[#C9A840] font-semibold tracking-wide">Wings of Future</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
          We bring intelligent automation to Indian homes — turning ordinary spaces into smart,
          efficient, and connected living environments.
        </p>
        <p className="text-sm text-zinc-400">
          Welcome back, <span className="font-semibold text-zinc-700 dark:text-zinc-200">{firstName}</span> 👋
        </p>
      </section>

      {/* Team Photo */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 text-center">Meet the Team</h2>
        <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-lg bg-zinc-100 dark:bg-zinc-800">
          {/*
            ── HOW TO ADD YOUR TEAM PHOTO ──────────────────────────────────────
            1. Save your group photo as:  /public/team-photo.jpg
            2. Delete the placeholder div below and uncomment the <Image> tag.
            ──────────────────────────────────────────────────────────────────
          */}

          {/* Placeholder — remove once you add /public/team-photo.jpg */}
          <div className="flex flex-col items-center justify-center h-72 sm:h-96 gap-3 text-zinc-400 dark:text-zinc-500">
            <svg className="h-14 w-14 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm font-medium">Team photo goes here</p>
            <p className="text-xs">Add your photo at <code className="bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-300">/public/team-photo.jpg</code></p>
          </div>

          {/* Uncomment once photo is added:
          <Image
            src="/team-photo.jpg"
            alt="Galaxy Home Automation Team"
            width={1200}
            height={600}
            className="w-full object-cover"
            unoptimized
          />
          */}

          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-6 py-4">
            <p className="text-white font-bold text-base">The Galaxy Team</p>
            <p className="text-white/70 text-xs mt-0.5">10 members · Ahmedabad, Gujarat</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="space-y-5">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 text-center">What We Stand For</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex gap-4">
              <span className="text-2xl flex-shrink-0">{v.icon}</span>
              <div>
                <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{v.title}</p>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team grid */}
      <section className="space-y-5">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 text-center">Our People</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {TEAM.map((member) => (
            <div key={member.name} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col items-center text-center gap-2">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-lg font-bold text-amber-700 dark:text-amber-300">
                {member.name.charAt(0)}
              </div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">{member.name}</p>
              <p className="text-[10px] text-zinc-400 leading-tight">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer strip */}
      <section className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-bold text-white text-base">Ready to get started?</p>
          <p className="text-white/80 text-xs mt-0.5">Use the sidebar to navigate to your workspace.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition-colors">
            Projects
          </Link>
          <Link href="/site-operations" className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors">
            Site Ops
          </Link>
        </div>
      </section>

    </div>
  );
}
