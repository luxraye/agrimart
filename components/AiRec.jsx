import { Lightbulb } from "lucide-react";

export default function AiRec({ label = "Recommendation", children }) {
  return (
    <div className="flex gap-3 bg-brand-50 border-l-2 border-brand-400 rounded-r-xl px-4 py-3.5 mt-4">
      <Lightbulb size={15} className="text-brand-600 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-[10px] uppercase tracking-wider text-brand-600 font-medium mb-1">{label}</p>
        <p className="text-sm text-gray-600 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
