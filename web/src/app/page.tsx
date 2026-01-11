"use client";
import { WeatherWidget } from "@/components/bento/widgets/weather";
import MapBox from "@/components/bento/widgets/map/map";
import NewsWidget from "@/components/bento/widgets/news/news";
import { useState } from "react";
import ExpandedWeather from "../components/bento/widgets/weather/ExpandedWeather";
import ExpandedNews from "../components/bento/widgets/news/ExpandedNews";
import ExpandedMap from "../components/bento/widgets/map/ExpandedMap";
import ExpandedEmpty from "../components/bento/widgets/ExpandedEmpty";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ExpandedChat from "../components/bento/widgets/ExpandedChat";

export default function Home() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  return (
    <div className="w-screen h-screen overflow-hidden bg-background">
      <div className="grid gap-6 p-4 grid-rows-8 grid-cols-16 h-full">
        <div
          className="row-span-4 col-span-4 row-start-2 col-start-2 cursor-pointer"
          onClick={() => setExpandedCard("weather")}
        >
          <WeatherWidget className="w-full h-full" />
        </div>
        <div
          className="bento-card p-4 rounded-2xl overflow-hidden row-span-3 col-span-3 row-start-2 col-start-6 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.1s] cursor-pointer"
          onClick={() => setExpandedCard("card3")}
        >
          <p>Card 3</p>
        </div>
        <div
          className="bento-card p-4 rounded-2xl overflow-hidden row-span-3 col-span-3 row-start-2 col-start-9 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.2s] cursor-pointer"
          onClick={() => setExpandedCard("news")}
        >
          <NewsWidget />
        </div>
        <div
          className="bento-card p-4 rounded-2xl overflow-hidden row-span-2 col-span-4 row-start-2 col-start-12 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.3s] cursor-pointer"
          onClick={() => setExpandedCard("posts")}
        ></div>
        <div
          className="bento-card p-4 rounded-2xl overflow-hidden row-span-2 col-span-4 row-start-6 col-start-2 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.4s] cursor-pointer"
          onClick={() => setExpandedCard("card5")}
        ></div>
        {/* <div className="bento-card p-4 rounded-2xl row-span-3 col-span-6 row-start-5 col-start-6 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.5s] overflow-hidden"> */}
        <div
          className="row-span-3 col-span-6 row-start-5 col-start-6 cursor-pointer"
          onClick={() => setExpandedCard("map")}
        >
          <MapBox className="w-full h-full" />
        </div>
        {/* </div> */}
        <div
          className="bento-card p-4 rounded-2xl overflow-hidden row-span-4 col-span-4 row-start-4 col-start-12 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.6s] cursor-pointer"
          onClick={() => setExpandedCard("news")}
        ></div>
      </div>

      <Dialog
        open={!!expandedCard}
        onOpenChange={(open) => !open && setExpandedCard(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          {expandedCard === "weather" && <ExpandedWeather />}
          {expandedCard === "news" && <ExpandedNews />}
          {expandedCard === "map" && <ExpandedMap />}
          {expandedCard === "card3" && <ExpandedEmpty title="Card 3" />}
          {expandedCard === "card5" && <ExpandedChat />}
          {expandedCard === "posts" && <ExpandedEmpty title="posts" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
