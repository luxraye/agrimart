"use client";

import dynamic from "next/dynamic";
import RequireAuth from "@/components/RequireAuth";

const AgriMap = dynamic(() => import("@/components/AgriMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-paper">
      <div className="w-7 h-7 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  ),
});

function MapContent() {
  return (
    <div
      style={{ height: "calc(100dvh - 124px)" }}
      className="md:!h-[calc(100dvh-64px)] w-full relative"
    >
      <AgriMap />
    </div>
  );
}

export default function MapPage() {
  return <RequireAuth><MapContent /></RequireAuth>;
}
