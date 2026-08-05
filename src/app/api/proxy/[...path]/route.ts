import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://api.simpenakun.site";
const TOKEN_COOKIE = "simpenakun_token";

export const dynamic = "force-dynamic";

function getAuthToken(request: NextRequest): string | null {
  // Priority: Authorization header > X-Auth-Token header > Cookie
  const authHeader = request.headers.get("authorization");
  if (authHeader) return authHeader;

  const customToken = request.headers.get("x-auth-token");
  if (customToken) return `Bearer ${customToken}`;

  const cookieToken = request.cookies.get(TOKEN_COOKIE)?.value;
  if (cookieToken) return `Bearer ${cookieToken}`;

  return null;
}

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

  const token = getAuthToken(request);
  if (token) {
    headers["Authorization"] = token;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    headers["Content-Type"] = "application/json";
    let body: string | undefined;
    try {
      body = await request.text();
    } catch {
      // no body
    }

    try {
      const response = await fetch(url, {
        method: request.method,
        headers,
        body: body || undefined,
      });
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

  // GET/HEAD requests
  try {
    const response = await fetch(url, {
      method: request.method,
      headers,
    });
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
