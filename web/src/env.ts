import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    CLERK_SECRET_KEY: z.string().min(1),
    CONVEX_DEPLOYMENT: z.string().min(1),
    OPENROUTER_API_KEY: z.string().min(1),
    GCLOUD_API_KEY: z.string().min(1),
    INTERNAL_CONVEX_SECRET: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_CONVEX_URL: z.string().min(1),
    NEXT_PUBLIC_NEWS_SERVER: z.string().min(1),
  },
  experimental__runtimeEnv: {
    ...process.env,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL ?? "",
    NEXT_PUBLIC_NEWS_SERVER: process.env.NEXT_PUBLIC_NEWS_SERVER ?? "",
  }
})