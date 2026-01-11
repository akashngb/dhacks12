"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import MapBox from "@/components/bento/widgets/map/map";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { WeatherWidget } from "@/components/bento/widgets/weather";
import NewsWidget from "@/components/bento/widgets/news/news";
import { useState } from "react";
import ExpandedWeather from "@/components/bento/widgets/weather/ExpandedWeather";
import ExpandedNews from "@/components/bento/widgets/news/ExpandedNews";
import ExpandedEmpty from "@/components/bento/widgets/ExpandedEmpty";
import ExpandedChat from "@/components/bento/widgets/ExpandedChat";
import BackIcon from "@/components/bento/widgets/map/backIcon";

export default function Page() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  return (
    <div className="w-screen h-screen relative">
      <Sheet>
        <SheetTrigger asChild>
          <Button className="absolute top-1/2 -translate-y-1/2 right-4 z-10 bg-transparent">
            <BackIcon className="size-4.5" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="right"
          className="w-screen h-screen max-w-none sm:max-w-none border-none p-0 overflow-hidden bg-transparent"
        >
          <div className="grid gap-6 p-4 grid-rows-8 grid-cols-16 h-full">
            <div
              className="row-span-4 col-span-4 row-start-2 col-start-2 cursor-pointer"
              onClick={() => setExpandedCard("weather")}
            >
              <WeatherWidget className="w-full h-full" />
            </div>
            <div
              className="bento-card p-4 overflow-hidden row-span-3 col-span-3 row-start-2 col-start-6 animate-slide-up fill-mode-[both] [animation-delay:0.1s] cursor-pointer bg-[rgba(247,241,241,0.59)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)]"
              onClick={() => setExpandedCard("card3")}
            ></div>
            <div
              className="bento-card p-4 overflow-hidden row-span-3 col-span-3 row-start-2 col-start-9 animate-slide-up fill-mode-[both] [animation-delay:0.2s] cursor-pointer bg-[rgba(247,241,241,0.59)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)]"
              onClick={() => setExpandedCard("news")}
            >
              <NewsWidget expanded={false} />
            </div>
            <div
              className="bento-card p-4 overflow-hidden row-span-2 col-span-4 row-start-2 col-start-12 animate-slide-up fill-mode-[both] [animation-delay:0.3s] cursor-pointer bg-[rgba(247,241,241,0.59)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)]"
              onClick={() => setExpandedCard("posts")}
            ></div>
            <div
              className="bento-card p-4 overflow-hidden row-span-2 col-span-4 row-start-6 col-start-2 animate-slide-up fill-mode-[both] [animation-delay:0.4s] cursor-pointer bg-[rgba(247,241,241,0.59)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)]"
              onClick={() => setExpandedCard("card5")}
            ></div>
            <div
              className="bento-card p-4 overflow-hidden row-span-4 col-span-4 row-start-4 col-start-12 animate-slide-up fill-mode-[both] [animation-delay:0.6s] cursor-pointer bg-[rgba(247,241,241,0.59)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)]"
              onClick={() => setExpandedCard("card4")}
            ></div>
            <div className="row-span-3 col-span-6 row-start-5 col-start-6 cursor-pointer bg-[rgba(247,241,241,0.59)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)]"></div>
          </div>

          <Dialog
            open={!!expandedCard}
            onOpenChange={(open) => !open && setExpandedCard(null)}
          >
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
              <DialogTitle>{expandedCard}</DialogTitle>
              {expandedCard === "weather" && <ExpandedWeather />}
              {expandedCard === "news" && <ExpandedNews />}
              {expandedCard === "card3" && <ExpandedEmpty title="Card 3" />}
              {expandedCard === "card5" && <ExpandedChat />}
              {expandedCard === "posts" && <ExpandedEmpty title="posts" />}
            </DialogContent>
          </Dialog>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetContent>
      </Sheet>
      <MapBox className="w-full h-full z-0" />
    </div>
  );
}
