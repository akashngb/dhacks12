"use server";

import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import Exa from "exa-js";
import { z } from "zod";
import { env } from "@/env";

const google = createGoogleGenerativeAI({
  apiKey: env.GCLOUD_API_KEY,
});

const eventSchema = z.object({
  events: z.array(
    z.object({
      title: z.string().describe("The event title/name"),
      date: z.string().describe("The event date in YYYY-MM-DD format"),
      time: z.string().optional().describe("The event time if available"),
      location: z.string().optional().describe("The event location/venue"),
      description: z.string().describe("A brief description of the event"),
      url: z.string().optional().describe("Link to event details if available"),
      category: z.string().optional().describe("Event category (e.g., music, sports, arts, food)"),
    })
  ),
});

type EventData = z.infer<typeof eventSchema>;

export async function scrapeEvents(): Promise<EventData> {
  // Get current date
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  // Initialize Exa client
  const exa = new Exa(process.env.EXA_API_KEY);

  // Search for Toronto events
  const searchQuery = `${formattedDate} Toronto events happening today`;
  console.log("[EXA] Searching:", searchQuery);

  const searchResults = await exa.searchAndContents(searchQuery, {
    type: "auto",
    numResults: 10,
    text: true,
    highlights: true,
  });

  if (!searchResults.results || searchResults.results.length === 0) {
    return { events: [] };
  }

  // Prepare content for Gemini
  const searchContent = searchResults.results
    .map((result, idx) => {
      return `
[Source ${idx + 1}]
Title: ${result.title}
URL: ${result.url}
${result.text ? `Content: ${result.text.slice(0, 1000)}...` : ""}
${result.highlights ? `Highlights: ${result.highlights.join("\n")}` : ""}
`;
    })
    .join("\n---\n");

  console.log("[GEMINI] Processing events with AI...");

  // Use Gemini to parse and structure the events
  const { object } = await generateObject({
    model: google("gemini-3-flash-preview"),
    schema: eventSchema,
    prompt: `You are an event curator for Toronto. Based on the following search results about events happening in Toronto today (${formattedDate}), extract and return a list of relevant events.

Focus on:
- Events happening today or in the near future
- Events in Toronto or the Greater Toronto Area
- Include specific details like time, location, and descriptions
- Filter out irrelevant or past events
- Deduplicate similar events

Search Results:
${searchContent}

Please extract and structure these events in a clear, organized manner.`,
  });

  console.log("[SUCCESS] Found", object.events.length, "events");

  return object;
}
