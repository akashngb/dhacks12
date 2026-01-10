import React from "react";
import { cn } from "@/lib/utils";
import { BentoGridProps, BentoItem } from "./types";

export const BentoGrid = ({
  items,
  gridCols,
  rowHeight = 100,
  classNames,
}: BentoGridProps): React.ReactNode => {
  return (
    <div
      className={cn(
        `grid gap-6 p-4 grid-rows-8 grid-cols-16
        ${classNames?.container ?? ""}`
      )}
      style={{
        gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
        gridAutoRows: `${rowHeight}px`,
      }}
    >
      {items.map((item: BentoItem) => (
        <div
          key={item.id}
          className={cn(
            ` bento-card ${
              item?.color ?? "bg-white"
            } p-4 rounded-2xl overflow-hidden ${
              classNames?.elementContainer ?? ""
            }`
          )}
          style={{
            gridColumn: `span ${item.width}`,
            gridRow: `span ${item.height}`,
          }}
        >
          {item.element}
        </div>
      ))}
    </div>
  );
};
