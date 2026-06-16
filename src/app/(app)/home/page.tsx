"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuthContext } from "@/components/providers/AuthProvider";

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

const STATS = [
  { value: "500+", label: "Homes Automated" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "5+", label: "Years of Excellence" },
  { value: "10", label: "Expert Team Members" },
];

export default function HomePage() {
  const { user } = useAuthContext();
  const firstName = user?.displayName?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-full bg-white dark:bg-zinc-950">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 px-6 py-16 text-center">
        {/* Subtle gold glow */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, #C9A840 0%, transparent 70%)" }} />

        <div className="relative z-10 max-w-2xl mx-auto space-y-5">
          <div className="flex justify-center">
            <Image
              src="/Galaxy Logo no bg.jpeg"
              alt="Galaxy"
              width={64}
              height={64}
              className="rounded-xl object-contain"
              unoptimized
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Galaxy Home<br />
            <span className="text-[#C9A840]">Automation</span>
          </h1>
          <p className="text-zinc-400 text-base font-medium tracking-widest uppercase text-sm">
            Wings of Future
          </p>
          <p className="text-zinc-300 text-sm leading-relaxed max-w-md mx-auto">
            Transforming Indian homes into intelligent, connected living spaces —
            one installation at a time.
          </p>
          <div className="pt-2">
            <p className="inline-block rounded-full bg-white/10 border border-white/10 px-5 py-2 text-sm text-white/80 backdrop-blur-sm">
              Welcome back, <span className="font-semibold text-[#C9A840]">{firstName}</span> 👋
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-[#C9A840]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 divide-x divide-amber-600">
          {STATS.map((s) => (
            <div key={s.label} className="py-5 text-center">
              <p className="text-2xl font-extrabold text-white">{s.value}</p>
              <p className="text-xs text-amber-100 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-14 space-y-16">

        {/* ── Team Photo ── */}
        <section className="space-y-6">
          <div className="text-center space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[#C9A840]">Our Team</p>
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">The People Behind the Magic</h2>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              A passionate group of engineers, designers, and field experts united by one goal — making your home smarter.
            </p>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 group">
            <Image
              src="/team-photo.jpg"
              alt="Galaxy Home Automation Team"
              width={1200}
              height={700}
              className="w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              style={{ maxHeight: "480px" }}
              unoptimized
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            {/* Bottom caption */}
            <div className="absolute bottom-0 inset-x-0 px-6 py-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-white font-bold text-lg leading-tight">Galaxy Home Automation</p>
                  <p className="text-white/60 text-xs mt-1">Ahmedabad, Gujarat · Est. 2019</p>
                </div>
                <div className="flex -space-x-1">
                  {["A","M","R","K","D"].map((initial) => (
                    <div key={initial}
                      className="h-8 w-8 rounded-full bg-[#C9A840] border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow">
                      {initial}
                    </div>
                  ))}
                  <div className="h-8 w-8 rounded-full bg-zinc-700 border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow">
                    +5
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── What we do ── */}
        <section className="grid sm:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#C9A840]">What We Do</p>
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 leading-tight">
              Smart Homes,<br />Smarter Living
            </h2>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Galaxy Home Automation specialises in end-to-end smart home integration —
              from automated lighting and climate control to security systems and home theatres.
              We work with leading brands to bring the future into every corner of your home.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {["Lighting Control", "CCTV & Security", "Home Theatre", "Climate Control", "Smart Curtains", "Video Door Phone"].map((tag) => (
                <span key={tag} className="rounded-full border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {VALUES.map((v) => (
              <div key={v.title}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 space-y-2 hover:shadow-md transition-shadow">
                <span className="text-2xl">{v.icon}</span>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{v.title}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="rounded-3xl overflow-hidden relative">
          <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="absolute inset-0 opacity-5 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 0% 50%, #C9A840 0%, transparent 60%)" }} />
            <div className="relative text-center sm:text-left">
              <p className="text-xl font-extrabold text-white">Ready to get to work?</p>
              <p className="text-zinc-400 text-sm mt-1">Use the sidebar to navigate to your workspace.</p>
            </div>
            <div className="relative flex gap-3 flex-shrink-0">
              <Link href="/dashboard"
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-zinc-900 hover:bg-zinc-100 transition-colors shadow">
                Projects
              </Link>
              <Link href="/site-operations"
                className="rounded-xl bg-[#C9A840] px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-500 transition-colors shadow">
                Site Ops
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
