"use client";
import { Button } from "@/components/ui/button";
import MapBox from "@/components/bento/widgets/map/map";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { WeatherWidget } from "@/components/bento/widgets/weather";
import NewsWidget from "@/components/bento/widgets/news/news";
import { Github } from "@/components/bento/widgets/socials/github";
import ExpandedWeather from "@/components/bento/widgets/weather/ExpandedWeather";
import Devpost from "@/components/bento/widgets/socials/devpost";
import ExpandedNews from "@/components/bento/widgets/news/ExpandedNews";
import ExpandedEmpty from "@/components/bento/widgets/ExpandedEmpty";
import BackIcon from "@/components/bento/widgets/map/backIcon";
import { Badge } from "@/components/ui/badge";
import { ChatUi } from "@/components/chat";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Linkedin } from "lucide-react";
import Link from "next/link";

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
];

export default function Page() {
  const [expandedChat, setExpandedChat] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const posts = useQuery(api.functions.posts.listPosts, { limit: 5 });

  return (
    <div className="w-screen h-screen relative">
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          console.log("change", open);
          setSheetOpen(open);
          if (!open && expandedChat) {
            setExpandedChat(false);
          }
        }}
      >
        <SheetTrigger asChild>
          <Button className="absolute top-1/2 -translate-y-1/2 right-4 z-10 bg-transparent">
            <BackIcon className="size-4.5" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="right"
          className="w-screen h-screen max-w-none sm:max-w-none border-none p-0 overflow-hidden bg-transparent"
        >
          <SheetTitle className="sr-only">Navigation Panel</SheetTitle>
          <div className="grid gap-6 p-4 grid-rows-8 grid-cols-16 h-full">
            <Dialog>
              <DialogTrigger asChild>
                <div className="row-span-4 col-span-4 row-start-2 col-start-2 cursor-pointer">
                  <WeatherWidget className="w-full h-full" />
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                <DialogTitle>Weather</DialogTitle>
                <ExpandedWeather />
              </DialogContent>
            </Dialog>

            <div className="bento-card p-4 overflow-hidden row-span-2 col-span-4 row-start-2 col-start-12 animate-slide-up fill-mode-[both] [animation-delay:0.3s] cursor-pointer bg-[rgba(247,241,241,0.59)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)]"></div>
            <div className="bento-card p-4 overflow-hidden row-span-2 col-span-4 row-start-6 col-start-2 animate-slide-up fill-mode-[both] [animation-delay:0.4s] cursor-pointer bg-[rgba(247,241,241,0.59)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)]"></div>
            {/* <div
              className="bento-card p-4 overflow-hidden row-span-4 col-span-4 row-start-4 col-start-12 animate-slide-up fill-mode-[both] [animation-delay:0.6s] cursor-pointer bg-[rgba(247,241,241,0.59)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)]"
              onClick={() => setExpandedCard("news")}
            >
            </div> */}

            <div
              className={cn(
                "bento-card p-6 row-span-3 col-span-5 row-start-2 col-start-6 animate-slide-up fill-mode-[both] [animation-delay:0.1s] bg-[rgba(247,241,241,0.59)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)]",
                expandedChat
                  ? "overflow-hidden cursor-default"
                  : "overflow-y-hidden cursor-pointer"
              )}
            >
              {/* <h3 className="text-xl font-bold mb-5 text-gray-900">My Routes</h3> */}
              {!expandedChat && (
                <>
                  <div className="space-y-4">
                    {routes.map((route, index) => (
                      <div
                        key={index}
                        className="group relative bg-white/40 rounded-xl p-4 hover:bg-white/60 transition-all duration-300 hover:shadow-md"
                      >
                        {/* Top section with locations */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="shrink-0 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-blue-200"></div>
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {route.from}
                            </p>
                          </div>

                          <div className="shrink-0 px-3">
                            <svg
                              className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                              />
                            </svg>
                          </div>

                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="shrink-0 w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-200"></div>
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {route.to}
                            </p>
                          </div>
                        </div>

                        {/* Bottom section with distance and duration */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200/50">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                              />
                            </svg>
                            <span className="font-medium">
                              {route.distance}
                            </span>
                          </div>

                          <Badge variant="secondary">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {route.duration}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="bento-card p-4 overflow-hidden row-span-3 col-span-1 row-start-2 col-start-11 animate-slide-up fill-mode-[both] [animation-delay:0.2s] cursor-pointer bg-[rgba(247,241,241,0.59)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)]">
              <div className="w-full h-full flex flex-col items-center justify-between">
                <Link href="https://github.com/akashngb/dhacks12">
                  <Github className="w-10 h-10" />
                </Link>
                <Linkedin />
                <Devpost className="w-10 h-10" />
              </div>
            </div>

            <button
              onClick={() => setExpandedChat(true)}
              className={cn(
                expandedChat && "row-span-6 row-start-2 bg-white",
                !expandedChat && "row-span-3 row-start-5 bg-[rgba(247,241,241,0.59)] hover:bg-[rgba(247,241,241,0.75)]",
                "col-span-6 col-start-6 cursor-pointer rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)] flex p-6 transition-all",
                expandedChat ? "items-stretch justify-stretch" : "items-center justify-center"
              )}
            >
              {expandedChat ? (
                <div className="h-full w-full">
                  <ChatUi />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-gray-700">
                  <svg
                    className="w-12 h-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span className="text-lg font-semibold">Chat</span>
                </div>
              )}
            </button>

            <div className="row-span-4 col-span-4 row-start-4 col-start-12 flex flex-col">
              <NewsWidget />
            </div>
          </div>

          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetContent>
      </Sheet>
      <MapBox className="w-full h-full z-0" />
    </div>
  );
}
