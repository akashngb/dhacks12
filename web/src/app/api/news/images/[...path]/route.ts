import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";

// The actual news server endpoint on the private network
const NEWS_SERVER_URL = env.NEXT_PUBLIC_NEWS_SERVER;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await params in Next.js 15+
    const resolvedParams = await params;
    
    // Reconstruct the image path from the dynamic segments
    const imagePath = resolvedParams.path.join("/");

    // Forward the request to the actual news server
    const response = await fetch(`${NEWS_SERVER_URL}/images/${imagePath}`, {
      method: "GET",
    });

    if (!response.ok) {
      return new NextResponse("Image not found", { status: response.status });
    }

    // Get the image data as a buffer
    const imageBuffer = await response.arrayBuffer();

    // Get content type from the response
    const contentType = response.headers.get("content-type") || "image/png";

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, immutable",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return new NextResponse("Failed to fetch image", { status: 500 });
  }
}
