import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";

// The actual news server endpoint on the private network
const NEWS_SERVER_URL = env.NEXT_PUBLIC_NEWS_SERVER;

export async function GET(request: NextRequest) {
  try {
    // Forward the request to the actual news server
    const response = await fetch(`${NEWS_SERVER_URL}/news`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch news from server" },
        { status: response.status }
      );
    }

    // Get the response data
    const data = await response.json();

    // Return the response
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    });
  } catch (error) {
    console.error("News proxy error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Proxy request failed",
      },
      { status: 500 }
    );
  }
}
