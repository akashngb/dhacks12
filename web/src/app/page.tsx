import { WeatherWidget } from "@/components/bento/widgets/weather";
import { SunIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import MapBox from "@/components/bento/widgets/map/map";

export default function Home() {
  const gridCols = 16;
  const rowHeight = 100;

  return (
    <div className="w-full h-full">
      <div
        className={cn(`grid gap-6 p-4 grid-rows-8 grid-cols-16 h-full`)}
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          gridAutoRows: `${rowHeight}px`,
        }}
      >
        <div className="bento-card p-4 rounded-2xl overflow-hidden row-span-4 col-span-4 row-start-2 col-start-2 bg-[#F8F4E3] animate-slide-up fill-mode-[both]">
          <WeatherWidget variant="wide" />
        </div>
        <div className="bento-card p-4 rounded-2xl overflow-hidden row-span-3 col-span-3 row-start-2 col-start-6 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.1s]"></div>
        <div className="bento-card p-4 rounded-2xl overflow-hidden row-span-3 col-span-3 row-start-2 col-start-9 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.2s]"></div>
        <div className="bento-card p-4 rounded-2xl overflow-hidden row-span-2 col-span-4 row-start-2 col-start-12 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.3s]"></div>
        <div className="bento-card p-4 rounded-2xl overflow-hidden row-span-2 col-span-4 row-start-6 col-start-2 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.4s]"></div>
        <div className="bento-card p-4 rounded-2xl overflow-hidden row-span-3 col-span-6 row-start-5 col-start-6 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.5s]">
          <MapBox />
        </div>
        <div className="bento-card p-4 rounded-2xl overflow-hidden row-span-4 col-span-4 row-start-4 col-start-12 bg-[#F8F4E3] animate-slide-up [animation-fill-mode:both] [animation-delay:0.6s]"></div>
      </div>
    </div>
  );
}
