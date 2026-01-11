"use client";
import { WeatherWidget } from "@/components/bento/widgets/weather";
import MapBox from "@/components/bento/widgets/map/map";
import NewsWidget from "@/components/bento/widgets/news/news";
import { useState } from "react";
import ExpandedWeather from "../components/bento/widgets/ExpandedWeather";
import ExpandedNews from "../components/bento/widgets/ExpandedNews";
import ExpandedMap from "../components/bento/widgets/ExpandedMap";
import ExpandedEmpty from "../components/bento/widgets/ExpandedEmpty";
import ExpandedChat from "../components/bento/widgets/ExpandedChat";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Home() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  return (
    <div className="w-screen h-screen overflow-hidden">
      <div className="grid gap-6 p-4 grid-rows-8 grid-cols-16 h-full">
        <div className="row-span-4 col-span-4 row-start-2 col-start-2">
          <WeatherWidget className="w-full h-full" />
        </div>
        <div
          onClick={() => setExpandedCard("news")}
          className="bento-card p-4 rounded-2xl overflow-hidden row-span-3 col-span-3 row-start-2 col-start-6 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.1s] cursor-pointer"
        >
          <NewsWidget expanded={false} />
        </div>
        <div
          onClick={() => setExpandedCard("card3")}
          className="bento-card p-4 rounded-2xl overflow-hidden row-span-3 col-span-3 row-start-2 col-start-9 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.2s] cursor-pointer"
        ></div>
        <div className="bento-card p-4 rounded-2xl row-span-2 col-span-4 row-start-2 col-start-12 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.3s] min-h-0 w-full h-full flex flex-col relative items-center justify-center">
          <Carousel className="w-full h-full relative">
            <CarouselContent className="h-full flex mt-10">
              <CarouselItem className="h-full flex items-center justify-center font-bold text-xl">
                Police: 911
              </CarouselItem>
              <CarouselItem className="h-full flex items-center justify-center font-bold text-xl">
                NE-Police: 611
              </CarouselItem>
              <CarouselItem className="h-full flex items-center justify-center font-bold text-xl">
                Community: 311
              </CarouselItem>
            </CarouselContent>
            <div className="absolute bottom-6 left-6 right-6 flex justify-between pointer-events-auto">
              <CarouselPrevious className="relative position-static" />
              <CarouselNext className="relative position-static" />
            </div>
          </Carousel>
        </div>
        <div
          onClick={() => setExpandedCard("card5")}
          className="bento-card p-4 rounded-2xl overflow-hidden row-span-2 col-span-4 row-start-6 col-start-2 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.4s] cursor-pointer"
        ></div>
        <div
          onClick={() => setExpandedCard("map")}
          className="bento-card p-4 rounded-2xl row-span-3 col-span-6 row-start-5 col-start-6 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.5s] overflow-hidden cursor-pointer"
        >
          <MapBox />
        </div>
        <div
          onClick={() => setExpandedCard("posts")}
          className="bento-card p-4 rounded-2xl overflow-hidden row-span-4 col-span-4 row-start-4 col-start-12 bg-[#F8F4E3] animate-slide-up fill-mode-[both] [animation-delay:0.6s] cursor-pointer"
        >
          <p>Posts</p>
        </div>
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
