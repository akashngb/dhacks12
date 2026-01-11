import { mutation, query } from "."
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});

export const getPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    if (!post) return null;

    // Get URLs for all images
    const imagesWithUrls = await Promise.all(
      post.images.map(async (image) => ({
        url: await ctx.storage.getUrl(image.storageId),
        alt: image.alt,
        storageId: image.storageId,
      }))
    );

    return {
      ...post,
      images: imagesWithUrls,
    };
  },
});

export const listPosts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 50 }) => {
    const posts = await ctx.db
      .query("posts")
      .order("desc")
      .take(limit);

    // Get URLs for all images in all posts
    return await Promise.all(
      posts.map(async (post) => {
        const imagesWithUrls = await Promise.all(
          post.images.map(async (image) => ({
            url: await ctx.storage.getUrl(image.storageId),
            alt: image.alt,
            storageId: image.storageId,
          }))
        );

        return {
          ...post,
          images: imagesWithUrls,
        };
      })
    );
  },
});

export const createPost = mutation({
  args: {
    content: v.string(),
    images: v.array(v.object({
      storageId: v.id("_storage"),
      alt: v.string(),
    })),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    tags: v.array(v.string()),
  },
  handler: async (ctx, { content, images, location, tags }) => {
    const post = await ctx.db.insert("posts", {
      userId: ctx.userId,
      content,
      images,
      location,
      tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return post;
  },
});

