import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://api.simpenakun.site";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  return proxyRequest(request, context.params.path);
}

export async function POST(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  return proxyRequest(request, context.params.path);
}

export async function PUT(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  return proxyRequest(request, context.params.path);
}

export async function DELETE(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  return proxyRequest(request, context.params.path);
}

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  const queryString = searchParams ? `?${searchParams}` : "";
  const url = `${API_URL}/api/${path}${queryString}`;

  const headers: Record<string, string> = {};

  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      const body = await request.text();
      if (body) {
        headers["Content-Type"] = "application/json";
        fetchOptions.body = body;
      }
    } catch {
      // no body
    }
  }

  fetchOptions.headers = headers;

  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to connect to API" },
      { status: 502 }
    );
  }
}
