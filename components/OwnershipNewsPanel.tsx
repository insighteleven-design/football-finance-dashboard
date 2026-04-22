import { type ClubNews, type NewsCategory } from "@/lib/ownershipNews";

const CATEGORY_CONFIG: Record<
  NewsCategory,
  { label: string; dot: string; bg: string; text: string }
> = {
  active_takeover: {
    label: "Active takeover",
    dot:   "bg-red-500",
    bg:    "bg-red-50 border-red-100",
    text:  "text-red-700",
  },
  rumour: {
    label: "Rumour",
    dot:   "bg-amber-400",
    bg:    "bg-amber-50 border-amber-100",
    text:  "text-amber-700",
  },
  investment: {
    label: "Investment",
    dot:   "bg-emerald-500",
    bg:    "bg-emerald-50 border-emerald-100",
    text:  "text-emerald-700",
  },
  ownership_change: {
    label: "Ownership change",
    dot:   "bg-blue-500",
    bg:    "bg-blue-50 border-blue-100",
    text:  "text-blue-700",
  },
  denial: {
    label: "Denial",
    dot:   "bg-gray-400",
    bg:    "bg-gray-50 border-gray-100",
    text:  "text-gray-600",
  },
  general: {
    label: "General",
    dot:   "bg-gray-300",
    bg:    "bg-gray-50 border-gray-100",
    text:  "text-gray-500",
  },
};

export default function OwnershipNewsPanel({ news }: { news: ClubNews | null }) {
  if (!news || news.stories.length === 0) {
    return (
      <div className="border border-[#e8e8e8] bg-white px-6 py-8 text-center">
        <p className="text-sm text-[#aaaaaa] italic">No recent ownership news found.</p>
        <p className="text-xs text-[#cccccc] mt-2">
          Last checked: {news?.scraped_at ? new Date(news.scraped_at).toLocaleDateString("en-GB") : "—"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {news.stories.map((story, i) => {
        const cfg = CATEGORY_CONFIG[story.category] ?? CATEGORY_CONFIG.general;
        return (
          <div key={i} className={`border ${cfg.bg} px-5 py-4`}>
            {/* Category pill + date */}
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                <span className={`text-xs font-semibold tracking-[0.08em] uppercase ${cfg.text}`}>
                  {cfg.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#999999] shrink-0">
                {story.source && <span>{story.source}</span>}
                {story.date && <span>· {story.date}</span>}
              </div>
            </div>

            {/* Headline */}
            {story.url ? (
              <a
                href={story.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[#111111] hover:text-[#4A90D9] hover:underline leading-snug block mb-1.5"
              >
                {story.headline}
              </a>
            ) : (
              <p className="text-sm font-medium text-[#111111] leading-snug mb-1.5">{story.headline}</p>
            )}

            {/* Summary */}
            <p className="text-sm text-[#555555] leading-relaxed">{story.summary}</p>
          </div>
        );
      })}

      <p className="text-xs text-[#cccccc]">
        Sourced via DuckDuckGo · summarised by Claude AI · last updated{" "}
        {new Date(news.scraped_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
    </div>
  );
}
