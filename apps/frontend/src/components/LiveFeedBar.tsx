"use client";

import { useEffect, useState } from "react";

// Simulated live feed data - Bloomberg terminal style
const feedItems = [
  { type: "transfer", text: "Man Utd monitoring RB Leipzig forward", time: "2m" },
  { type: "result", text: "FT: Barcelona 3-1 Real Sociedad", time: "15m" },
  { type: "injury", text: "Liverpool: Salah slight knock in training", time: "23m" },
  { type: "rumor", text: "PSG readying record bid for Bellingham", time: "31m" },
  { type: "match", text: "LIVE: Bayern 1-0 Dortmund (67')", time: "NOW" },
  { type: "financial", text: "Premier League TV rights up 12% YoY", time: "45m" },
  { type: "result", text: "FT: AC Milan 2-2 Inter Milan", time: "1h" },
  { type: "transfer", text: "Arsenal scout at Benfica vs Porto", time: "1h" },
];

export default function LiveFeedBar() {
  const [currentItems, setCurrentItems] = useState(feedItems);

  // Rotate items periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentItems((prev) => {
        const rotated = [...prev.slice(1), prev[0]];
        return rotated;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "transfer": return "text-blue-400";
      case "result": return "text-green-400";
      case "injury": return "text-red-400";
      case "rumor": return "text-yellow-400";
      case "match": return "text-gold";
      case "financial": return "text-purple-400";
      default: return "text-offwhite-500";
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case "transfer": return "bg-blue-400/10";
      case "result": return "bg-green-400/10";
      case "injury": return "bg-red-400/10";
      case "rumor": return "bg-yellow-400/10";
      case "match": return "bg-gold/10";
      case "financial": return "bg-purple-400/10";
      default: return "bg-white/5";
    }
  };

  return (
    <div className="h-8 glass flex items-center border-t border-white/5">
      <div className="flex items-center gap-2 px-3 border-r border-white/5 h-full shrink-0">
        <span className="live-dot" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-offwhite-500">Live Feed</span>
      </div>
      <div className="flex-1 overflow-hidden px-2">
        <div className="flex items-center gap-6 animate-ticker">
          {[...currentItems, ...currentItems].map((item, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] font-bold uppercase ${getTypeColor(item.type)} ${getTypeBg(item.type)} px-1.5 py-0.5 rounded`}>
                {item.type}
              </span>
              <span className="text-[11px] text-offwhite-300">{item.text}</span>
              <span className="text-[10px] text-offwhite-500">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
