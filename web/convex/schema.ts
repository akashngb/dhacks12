import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  events: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    images: v.array(v.string()),
    link: v.optional(v.string()),
    latitude: v.number(),
    longitude: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  posts: defineTable({
    userId: v.string(),
    content: v.string(), // markdown
    images: v.array(v.object({
      storageId: v.id("_storage"),
      alt: v.string(),
    })),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt", "updatedAt"])
    .index("by_location", ["location.latitude", "location.longitude"])
    .index("by_tags", ["tags"]),
});