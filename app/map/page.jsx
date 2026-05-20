"use client";

import dynamic from "next/dynamic";
import RequireAuth from "@/components/RequireAuth";

const AgriMap = dynamic(() => import("@/components/AgriMap"), { ssr: false });

function MapContent() {
  return (
    <div
      style={{ height: "calc(100dvh - 112px)" }}
      className="md:h-[calc(100dvh-56px)] w-full relative"
    >
      <AgriMap />
    </div>
  );
}

export default function MapPage() {
  return <RequireAuth><MapContent /></RequireAuth>;
}
