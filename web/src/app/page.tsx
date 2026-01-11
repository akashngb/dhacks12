"use client";
import { WeatherWidget } from "@/components/bento/widgets/weather";
import MapBox from "@/components/bento/widgets/map/map";
import NewsWidget from "@/components/bento/widgets/news/news";
import { useState } from "react";
import ExpandedWeather from "../components/bento/widgets/ExpandedWeather";
import ExpandedNews from "../components/bento/widgets/ExpandedNews";
import ExpandedMap from "../components/bento/widgets/ExpandedMap";
import ExpandedEmpty from "../components/bento/widgets/ExpandedEmpty";
import { SignedIn } from "@clerk/nextjs";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ExpandedChat from "../components/bento/widgets/ExpandedChat";

export default function Home() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  return (
    <div className="w-screen h-screen overflow-hidden">
      <div className="grid gap-6 p-4 grid-rows-8 grid-cols-16 h-full">
        <WeatherWidget className="row-span-4 col-span-4 row-start-2 col-start-2" />
        <div className="bento-card p-4 rounded-2xl overflow-hidden row-span-3 col-span-3 row-start-2 col-start-6 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.1s]"></div>
        <div className="bento-card p-4 rounded-2xl overflow-hidden row-span-3 col-span-3 row-start-2 col-start-9 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.2s]"></div>
        <div className="bento-card p-4 rounded-2xl overflow-hidden row-span-2 col-span-4 row-start-2 col-start-12 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.3s]"></div>
        <div className="bento-card p-4 rounded-2xl overflow-hidden row-span-2 col-span-4 row-start-6 col-start-2 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.4s]"></div>
        {/* <div className="bento-card p-4 rounded-2xl row-span-3 col-span-6 row-start-5 col-start-6 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.5s] overflow-hidden"> */}
        <MapBox className="row-span-3 col-span-6 row-start-5 col-start-6 " />
        {/* </div> */}
        <div className="bento-card p-4 rounded-2xl overflow-hidden row-span-4 col-span-4 row-start-4 col-start-12 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.6s]"></div>
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
