"use client";

import Image from "next/image";
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

export default function HomePage() {
  const { user } = useAuthContext();
  const firstName = user?.displayName?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-full bg-white dark:bg-zinc-950">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 px-6 py-16 text-center">
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
          <p className="text-zinc-400 text-sm font-medium tracking-widest uppercase">
            Wings of Future
          </p>
          <div className="pt-1">
            <p className="inline-block rounded-full bg-white/10 border border-white/10 px-5 py-2 text-sm text-white/80 backdrop-blur-sm">
              Welcome back, <span className="font-semibold text-[#C9A840]">{firstName}</span> 👋
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-14">

        {/* ── Team Photo ── */}
        <section className="space-y-5">
          <div className="text-center space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[#C9A840]">Our Team</p>
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">The People Behind the Magic</h2>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 group">
            <Image
              src="/team-photo.jpg"
              alt="Galaxy Home Automation Team"
              width={1200}
              height={700}
              className="w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              style={{ maxHeight: "460px" }}
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 px-6 py-5">
              <p className="text-white font-bold text-base">Galaxy Home Automation</p>
              <p className="text-white/60 text-xs mt-0.5">Ahmedabad, Gujarat</p>
            </div>
          </div>
        </section>

        {/* ── Our People ── */}
        <section className="space-y-5">
          <div className="text-center space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[#C9A840]">Our People</p>
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">Meet the Team</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {TEAM.map((member) => (
              <div key={member.name}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col items-center text-center gap-2 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-lg font-bold text-amber-700 dark:text-amber-300">
                  {member.name.charAt(0)}
                </div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">{member.name}</p>
                <p className="text-[10px] text-zinc-400 leading-tight">{member.role}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
