"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { MapPin, Tag as TagIcon, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";

export function Featured() {
  const data = useQuery(api.functions.posts.listPosts, {
    limit: 10
  })

  if (!data) {
    return (
      <div className="h-full flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-linear-to-br from-purple-500 to-pink-600 ring-1 ring-purple-200 animate-pulse"></div>
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">
          Featured Posts
        </h3>
      </div>

      {/* Posts Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <TagIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">No posts yet</p>
            </div>
          </div>
        ) : (
          data.map((post, index) => (
            <motion.div
              key={post._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative bg-white/40 rounded-lg p-2.5 hover:bg-white/60 hover:shadow-md transition-all duration-200 cursor-pointer border border-white/30"
            >
              {/* Post Content */}
              <div className="space-y-1.5">
                <p className="text-xs text-gray-800 leading-relaxed line-clamp-2 font-medium">
                  {post.content}
                </p>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 3).map((tag, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="px-1.5 py-0 h-4 text-[9px] font-medium bg-linear-to-r from-purple-100 to-pink-100 text-purple-700 border-none"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {post.tags.length > 3 && (
                      <Badge
                        variant="secondary"
                        className="px-1.5 py-0 h-4 text-[9px] font-medium bg-gray-100 text-gray-600 border-none"
                      >
                        +{post.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5">
                  {post.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" />
                      <span className="truncate max-w-[80px]">
                        {post.location.latitude.toFixed(2)}, {post.location.longitude.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 ml-auto">
                    <Clock className="w-2.5 h-2.5" />
                    <span>
                      {new Date(post.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gradient Accent */}
              <div className="absolute inset-0 rounded-lg bg-linear-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 transition-all duration-200 pointer-events-none"></div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}