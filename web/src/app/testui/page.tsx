"use client";
import { Button } from "@/components/ui/button";
import MapBox from "@/components/bento/widgets/map/map";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import Link from "next/link";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { WeatherWidget } from "@/components/bento/widgets/weather";
import NewsWidget from "@/components/bento/widgets/news/news";
import { Github } from "@/components/bento/widgets/socials/github";
import { Linkedin } from "@/components/bento/widgets/socials/linkedin";
import { useState } from "react";
import ExpandedWeather from "@/components/bento/widgets/weather/ExpandedWeather";
import Devpost from "@/components/bento/widgets/socials/devpost";
import ExpandedNews from "@/components/bento/widgets/news/ExpandedNews";
import ExpandedEmpty from "@/components/bento/widgets/ExpandedEmpty";
import ExpandedChat from "@/components/bento/widgets/ExpandedChat";
import BackIcon from "@/components/bento/widgets/map/backIcon";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

const routes = [
  {
    from: "80 York Mills Rd",
    to: "100 Queen St W",
    distance: "10.5 km",
    duration: "15 mins",
  },
  {
    from: "25 Yonge St",
    to: "Union Station",
    distance: "2.5 km",
    duration: "5 mins",
  },
  {
    from: "Union Station",
    to: "192 Queens Quay W",
    distance: "10.5 km",
    duration: "5 mins",
  },
];

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
              className="bento-card p-4 overflow-y-hidden row-span-3 col-span-5 row-start-2 col-start-6 animate-slide-up fill-mode-[both] [animation-delay:0.1s] cursor-pointer bg-[rgba(247,241,241,0.59)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)]"
              onClick={() => setExpandedCard("card3")}
            >
              <h3 className="text-lg font-bold mb-3">My Routes</h3>
              <div className="space-y-3">
                {routes.map((route, index) => (
                  <div
                    key={index}
                    className={cn(
                      index === routes.length - 1
                        ? "border-b-0"
                        : "border-b border-gray-300"
                    )}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {route.from}
                        </p>
                      </div>
                      <div className="flex flex-col items-center justify-center px-2 shrink-0">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {route.distance}
                        </span>
                        <span className="text-xl text-gray-600">→</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {route.to}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{route.duration}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="bento-card p-4 overflow-hidden row-span-3 col-span-1 row-start-2 col-start-11 animate-slide-up fill-mode-[both] [animation-delay:0.2s] cursor-pointer bg-[rgba(247,241,241,0.59)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)]">
              <div className="flex flex-col justify-between items-center h-full w-full">
                <Link
                  href="https://github.com/akashngb/dhacks12"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="w-8 h-8 text-black" />
                </Link>
                <Link
                  href="https://www.linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="w-8 h-8" />
                </Link>
                <Link
                  href="https://deltahacks-12.devpost.com/?ref_feature=challenge&ref_medium=your-open-hackathons&ref_content=Submissions+open"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Devpost className="w-8 h-8" />
                </Link>
              </div>
            </div>

            <div
              className="bento-card p-4 overflow-hidden row-span-2 col-span-4 row-start-2 col-start-12 animate-slide-up fill-mode-[both] [animation-delay:0.3s] cursor-pointer bg-[rgba(247,241,241,0.59)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)]"
              onClick={() => setExpandedCard("posts")}
            ></div>
            {/* <div
              className="bento-card p-4 overflow-hidden row-span-2 col-span-4 row-start-6 col-start-2 animate-slide-up fill-mode-[both] [animation-delay:0.4s] cursor-pointer bg-[rgba(247,241,241,0.59)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)]"
              onClick={() => setExpandedCard("card5")}
            ></div> */}
            {/* <div
              className="bento-card p-4 overflow-hidden row-span-4 col-span-4 row-start-4 col-start-12 animate-slide-up fill-mode-[both] [animation-delay:0.6s] cursor-pointer bg-[rgba(247,241,241,0.59)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)]"
              onClick={() => setExpandedCard("news")}
            >
            </div> */}
            <div className="row-span-3 col-span-6 row-start-5 col-start-6 cursor-pointer bg-[rgba(247,241,241,0.59)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)]"></div>
            <div className="row-span-2 col-span-4 row-start-6 col-start-2">
              <NewsWidget />
              <NewsWidget />
            </div>
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
