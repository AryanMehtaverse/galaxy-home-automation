"use client";

import { useTheme } from "@/components/providers/ThemeProvider";

export default function QuotationsPage() {
  const { theme } = useTheme();

  return (
    <iframe
      src={`https://galaxy-quotation-system.vercel.app?embedded=true&theme=${theme}`}
      className="w-full h-full border-0 block"
      title="Galaxy Quotation System"
      allow="fullscreen"
    />
  );
}
