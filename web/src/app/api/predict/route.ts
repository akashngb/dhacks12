import { NextRequest, NextResponse } from "next/server";

// The actual ML API endpoint on the private network
const ML_API_URL = "http://akashs-macbook-air:5006/predict";

export async function POST(request: NextRequest) {
  try {
    // Get the JSON body from the incoming request
    const body = await request.json();

    // Forward the request to the actual ML API
    const response = await fetch(ML_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Get the response data
    const data = await response.json();

    // Return the response with appropriate status code
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Proxy request failed",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
