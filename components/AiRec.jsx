import { Lightbulb } from "lucide-react";

export default function AiRec({ label = "Recommendation", children }) {
  return (
    <div className="flex gap-3.5 bg-gradient-to-r from-brand-50 to-brand-50/30 border border-brand-200/60 rounded-2xl px-5 py-4 mt-4 animate-fade-up">
      <div className="w-8 h-8 rounded-xl bg-brand-700 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Lightbulb size={15} className="text-brand-100" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.16em] text-brand-700 font-semibold mb-1">{label}</p>
        <p className="text-[13.5px] text-ink/65 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
