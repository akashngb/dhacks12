import { streamText, convertToModelMessages,stepCountIs,tool } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { addressToLatLng, textSearchPlaces, textSearchPlacesOptionsSchema } from "@/google/maps";

const openrouter = createOpenRouter({
  apiKey: process.env.OPEN_ROUTER_API_KEY,
});

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  const result = streamText({
    model: openrouter(model || "google/gemini-3-flash-preview"),
    messages: await convertToModelMessages(messages),
    system: "You are an AI assistant for 'My Toronto'. Use the tools provided to help the user plan their day in Toronto!",
    onError: (error) => {
      console.error("error",error);
    },
    stopWhen: stepCountIs(15),
    tools: {
      searchPlaces: tool({
        description: "Search for places on google maps.",
        inputSchema: z.object({
          query: z.string(),
        }).extend(textSearchPlacesOptionsSchema.shape),
        execute: async ({ query, location, type, priceLevels }) => {
          console.log("[GMAPS]searchPlaces", query, location, type, priceLevels);
          return await textSearchPlaces(query, { location, type, priceLevels });
        },
      }),
      addressToLatLng: tool({
        description: "Convert an address to a latitude and longitude.",
        inputSchema: z.object({
          address: z.string(),
        }),
        execute: async ({ address }) => {
          console.log("addressToLatLng", address);
          return await addressToLatLng(address);
        },
      }),
    }
  });

  return result.toUIMessageStreamResponse();
}
