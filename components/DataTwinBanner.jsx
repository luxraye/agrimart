import { Info } from "lucide-react";

export default function DataTwinBanner({ className = "" }) {
  return (
    <div className={"flex items-start gap-2.5 text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl px-4 py-3 text-[13px] animate-fade-up " + className}>
      <Info size={15} className="mt-0.5 flex-shrink-0 text-amber-600" />
      <span>
        Regional proxy active — Limpopo, RSA (semi-arid, climate match 92%). Results are
        inferred from a matched agro-climatic twin, not live local telemetry.
      </span>
    </div>
  );
}
