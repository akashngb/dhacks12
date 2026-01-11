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
import { Featured } from "@/components/bento/widgets/featured";
import { WeatherWidget } from "@/components/bento/widgets/weather";
import NewsWidget from "@/components/bento/widgets/news/news";
import { Github } from "@/components/bento/widgets/socials/github";
import Devpost from "@/components/bento/widgets/socials/devpost";
import BackIcon from "@/components/bento/widgets/map/backIcon";
import { Badge } from "@/components/ui/badge";
import { ChatUi } from "@/components/chat";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Linkedin, Calendar, MapPin, Clock, Tag,Youtube } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useQuery as useReactQuery } from "@tanstack/react-query";
import { scrapeEvents } from "@/server/events";
import { Skeleton } from "@/components/ui/skeleton";
import Authenticated from "./authenticated";

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
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const { data: todo, isLoading: todoLoading, isError } = useReactQuery({
    queryKey: ["todo"],
    queryFn: async () => {
      return await scrapeEvents();
    },
  })

  const chatRef = useRef<HTMLButtonElement>(null);

  // Cycle through events every 5 seconds
  useEffect(() => {
    if (!todo?.events || todo.events.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentEventIndex((prev) => (prev + 1) % todo.events.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [todo?.events]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        setExpandedChat(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [chatRef]);

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
            <div className="row-span-4 col-span-4 row-start-2 col-start-2 cursor-pointer transition-transform duration-150 hover:scale-[1.02]">
              <WeatherWidget className="w-full h-full" />
            </div>

            <div className="bento-card p-4 overflow-hidden row-span-2 col-span-4 row-start-6 col-start-2 animate-slide-up fill-mode-[both] [animation-delay:0.4s] cursor-pointer bg-[rgba(247,241,241,0.59)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)] transition-transform duration-100 hover:scale-[1.02]">
              {todoLoading ? (
                <div className="h-full flex flex-col gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-5 w-3/4" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              ) : isError || !todo?.events || todo.events.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium">No events found</p>
                    <p className="text-[10px] opacity-75 mt-1">Check back later</p>
                  </div>
                </div>
              ) : (
                <div className="h-full w-full flex flex-col overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentEventIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col gap-2 h-full min-h-0"
                    >
                      {/* Event Title */}
                      <div className="flex items-start gap-2 min-h-0">
                        <div className="shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 ring-1 ring-blue-200"></div>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2 flex-1 min-w-0">
                          {todo.events[currentEventIndex].title}
                        </h3>
                      </div>

                      {/* Event Description */}
                      <p className="text-xs text-gray-700 leading-snug line-clamp-2 flex-shrink-0 min-w-0">
                        {todo.events[currentEventIndex].description}
                      </p>

                      {/* Event Details - Scrollable if needed */}
                      <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto">
                        {todo.events[currentEventIndex].date && (
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-600 min-w-0">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {new Date(todo.events[currentEventIndex].date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            {todo.events[currentEventIndex].time && (
                              <>
                                <Clock className="w-3 h-3 shrink-0" />
                                <span className="truncate">{todo.events[currentEventIndex].time}</span>
                              </>
                            )}
                          </div>
                        )}
                        
                        {todo.events[currentEventIndex].location && (
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-600 min-w-0">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{todo.events[currentEventIndex].location}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </div>
            <div className="bento-card p-4 overflow-hidden row-span-2 col-span-4 row-start-2 col-start-12 animate-slide-up fill-mode-[both] [animation-delay:0.3s] cursor-pointer bg-[rgba(247,241,241,0.59)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)] transition-transform duration-150 hover:scale-[1.02]">
              <Authenticated>
                <Featured />
              </Authenticated>
            </div>
            <div
              className={cn(
                "bento-card p-6 row-span-3 col-span-5 row-start-2 col-start-6 bg-[rgba(247,241,241,0.59)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)]",
                expandedChat
                  ? "overflow-hidden cursor-default"
                  : "overflow-hidden cursor-pointer transition-transform duration-150 hover:scale-[1.02]"
              )}
            >
              {!expandedChat && (
                <>
                  <div className="flex flex-col h-full gap-2 ">
                    {routes.map((route, index) => (
                      <div
                        key={index}
                        className="group relative bg-white/40 rounded-xl p-3 hover:bg-white/60 transition-all duration-150 hover:shadow-md flex-1 min-h-0 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-1">
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

                        <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
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
                          <Badge
                            variant="secondary"
                            className="px-2 py-0 h-6 flex items-center"
                          >
                            {route.duration}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="bento-card p-4 overflow-hidden row-span-3 col-span-1 row-start-2 col-start-11 animate-slide-up fill-mode-[both] [animation-delay:0.2s] cursor-pointer bg-[rgba(247,241,241,0.59)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)] transition-transform duration-150 hover:scale-[1.02]">
              <div className="w-full h-full flex flex-col items-center justify-between">
                <Link href="https://github.com/akashngb/dhacks12" target="_blank">
                  <Github className="w-10 h-10" />
                </Link>
                <Link href={"https://youtube.com/watch?v=dQw4w9WgXcQ"} target="_blank">
                  <Youtube className="w-10 h-10" />
                </Link>
                <Link href="https://devpost.com/software/big-city" target="_blank">
                  <Devpost className="w-10 h-10" />
                </Link>
              </div>
            </div>

            <motion.button
              ref={chatRef}
              layout
              onClick={() => setExpandedChat(true)}
              transition={{ type: "spring", stiffness: 150, damping: 30 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "col-span-6 col-start-6 cursor-pointer rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)] p-6 z-10",
                expandedChat
                  ? "row-span-6 row-start-2 bg-white items-stretch justify-stretch flex"
                  : "row-span-3 row-start-5 bg-[rgba(247,241,241,0.59)] hover:bg-[rgba(247,241,241,0.75)] items-center justify-center flex flex-col"
              )}
            >
              <AnimatePresence mode="wait">
                {expandedChat ? (
                  <motion.div
                    key="chat-ui"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full w-full"
                  >
                    <ChatUi />
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat-icon"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3 text-gray-700"
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Added p-3 here for border spacing */}
            <div className="row-span-4 col-span-4 row-start-4 col-start-12 flex flex-col p-3 transition-transform duration-150 hover:scale-[1.02] overflow-hidden rounded-2xl min-h-0 min-w-0 h-full w-full bg-[rgba(247,241,241,0.59)] shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[8.4px] border border-[rgba(247,241,241,0.19)] gap-4">
              <NewsWidget reverse={false} />
              <NewsWidget reverse={true} />
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
