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

type NewsWidgetProps = {
  reverse: boolean;
};

export default function NewsWidget(props: NewsWidgetProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const news = useQuery<NewsData>({
    queryKey: ["news"],
    queryFn: async () => {
      const response = await fetch("/api/news");
      if (!response.ok) {
        throw new Error("Failed to fetch news");
      }
      return response.json();
    },
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!api) return;

    const intervalId = setInterval(() => {
      if (hoveredIndex === null) {
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
      <div className="w-full h-full flex items-center justify-center">
        <p>Loading news...</p>
      </div>
    );
  }

  if (news.isError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p>Error loading news</p>
      </div>
    );
  }

  const newsData = news.data;
  const articles = props.reverse
    ? newsData?.articles?.slice().reverse() || []
    : newsData?.articles || [];

  if (articles.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p>No news available</p>
      </div>
    );
  }

  return (
    <Carousel
      setApi={setApi}
      className="w-full h-full overflow-hidden [&>div]:h-full"
      opts={{
        align: "start",
        loop: true,
      }}
    >
      <CarouselContent className="h-full ml-0">
        {articles.map((article: Article, index: number) => (
          <CarouselItem key={index} className="h-full pl-0">
            <Card
              className="w-full h-full rounded-xl overflow-hidden relative p-0 cursor-pointer group border-none shadow-none"
              onClick={() => {
                window.open(article.url, "_blank");
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <img
                src={`/api/news/${article.image}`}
                alt={article.headline}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="absolute top-1 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <h3 className="text-white font-semibold text-lg line-clamp-3 leading-tight mb-1">
                  {article.headline}
                </h3>
                <p className="text-white/80 text-xs uppercase tracking-wider font-medium">
                  {article.source}
                </p>
              </div>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
