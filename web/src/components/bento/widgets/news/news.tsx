"use client";

import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchGNews } from "@/utils/gnews";
import { useState, useEffect } from "react";

type newsProps = {
  expanded: boolean;
};

export default function NewsWidget(props: newsProps) {
  const [newsData, setNewsData] = useState<any>(null);
  useEffect(() => {
    async function getNews() {
      const data = await fetchGNews("Toronto OR weather");
      setNewsData(data);
    }
    getNews();
  }, []);
  return (
    <>
      <div className="w-full h-full grid grid-rows-2 grid-cols-2 gap-4">
        {newsData && newsData.articles && newsData.articles.length > 0 ? (
          newsData.articles.map((article: any, index: number) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Card
                  className="row-span-1 col-span-1 w-full h-full rounded-3xl overflow-hidden relative min-h-0 p-0"
                  onClick={() => {
                    location.href = `${article.url}`;
                  }}
                >
                  <img
                    src={article.image}
                    alt="news image"
                    className="w-full h-full object-cover"
                  />
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{article.title}</p>
              </TooltipContent>
            </Tooltip>
          ))
        ) : (
          <p>No news available</p>
        )}
      </div>
    </>
  );
}
