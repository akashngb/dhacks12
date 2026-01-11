import { streamText, convertToModelMessages,stepCountIs,tool } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";

const openrouter = createOpenRouter({
  apiKey: process.env.OPEN_ROUTER_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openrouter("google/gemini-3-flash-preview"),
    messages: await convertToModelMessages(messages),
    onError: (error) => {
      console.error("error",error);
    },
    stopWhen: stepCountIs(15),
    tools: {
      getSecret: tool({
        description: "Get secret",
        inputSchema: z.object({
          str: z.string(),
        }),
        execute: async ({ str }) => {
          console.log(str);
          if (str === "hello") {
            return "0000000000";
          }
          return {
            secret: "1234567890",
          };
        },
      })
    }
  });

  return result.toUIMessageStreamResponse();
}
