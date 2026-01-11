"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useQuery } from "@tanstack/react-query";

type Article = {
  headline: string;
  description: string;
  source: string;
  url: string;
  image: string;
  neighbourhood: string;
  category: string;
};

type NewsData = {
  generated_at: string;
  total_articles: number;
  articles: Article[];
};

export default function NewsWidget() {
  const [api, setApi] = useState<CarouselApi>();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const news = useQuery<NewsData>({
    queryKey: ["news"],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_NEWS_SERVER}/news`);
      if (!response.ok) {
        throw new Error("Failed to fetch news");
      }
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Auto-scroll carousel every 5 seconds
  useEffect(() => {
    if (!api) return;

    const intervalId = setInterval(() => {
      if (hoveredIndex === null) {
        // Only auto-scroll when not hovering
        if (api.canScrollNext()) {
          api.scrollNext();
        } else {
          api.scrollTo(0);
        }
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [api, hoveredIndex]);

  if (news.isLoading) {
    return (
      <div className="row-span-4 col-span-4 row-start-4 col-start-12 w-full h-full flex items-center justify-center">
        <p>Loading news...</p>
      </div>
    );
  }

  if (news.isError) {
    return (
      <div className="row-span-4 col-span-4 row-start-4 col-start-12 w-full h-full flex items-center justify-center">
        <p>Error loading news</p>
      </div>
    );
  }

  const newsData = news.data;
  const articles = newsData?.articles || [];

  if (articles.length === 0) {
    return (
      <div className="row-span-4 col-span-4 row-start-4 col-start-12 w-full h-full flex items-center justify-center">
        <p>No news available</p>
      </div>
    );
  }

  return (
    <Carousel
      setApi={setApi}
      className="w-full h-full overflow-hidden"
      opts={{
        align: "start",
        loop: true,
      }}
    >
      <CarouselContent className="h-full ml-0">
        {articles.map((article: Article, index: number) => (
          <CarouselItem key={index} className="h-full pl-0">
            <Card
              className="w-full h-full rounded-3xl overflow-hidden relative p-0 cursor-pointer group"
              onClick={() => {
                window.open(article.url, "_blank");
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <img
                src={`${process.env.NEXT_PUBLIC_NEWS_SERVER}/${article.image}`}
                alt={article.headline}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Headline that fades in on hover */}
              <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <h3 className="text-white font-semibold text-lg line-clamp-3">
                  {article.headline}
                </h3>
                <p className="text-white/80 text-sm mt-1">{article.source}</p>
              </div>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
