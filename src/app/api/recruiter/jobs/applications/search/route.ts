import { NextRequest, NextResponse } from "next/server";

const buildErrorResponse = (message: string, statusCode: number) => {
  return NextResponse.json(
    {
      code: statusCode,
      status: "CLIENT_ERROR",
      message,
      data: null,
    },
    { status: statusCode }
  );
};

const normalizeSort = (body: unknown) => {
  if (!body || typeof body !== "object") return body;
  const payload = body as Record<string, unknown>;
  const sortBy = typeof payload.sortBy === "string" ? payload.sortBy : null;
  const sortOrder = payload.sortOrder === "ASC" || payload.sortOrder === "DESC" ? payload.sortOrder : null;
  const sortedBy = sortBy && sortOrder ? [{ field: sortBy, sort: sortOrder }] : payload.sortedBy;
  const { sortBy: _sortBy, sortOrder: _sortOrder, ...rest } = payload;
  const next = { ...rest, sortedBy };
  if (Array.isArray(next.sortedBy)) {
    const allowedFields = new Set(["appliedAt", "status", "matchingScore"]);
    next.sortedBy = next.sortedBy.filter((item) => {
      if (!item || typeof item !== "object") return false;
      const field = (item as { field?: unknown }).field;
      return typeof field === "string" && allowedFields.has(field);
    });
  }
  return next;
};

export async function POST(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    return buildErrorResponse("Missing API base URL.", 500);
  }

  let body: unknown = {};
  try {
    const raw = await request.text();
    body = raw ? JSON.parse(raw) : {};
  } catch {
    body = {};
  }

  const normalized = normalizeSort(body);
  const targetUrl = new URL("/api/jobs/applications/search", baseUrl);

  const authHeader = request.headers.get("authorization");
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (authHeader) {
    headers.Authorization = authHeader;
  }

  try {
    const response = await fetch(targetUrl.toString(), {
      method: "POST",
      headers,
      body: JSON.stringify(normalized ?? {}),
    });
    const text = await response.text();
    try {
      const json = text ? JSON.parse(text) : {};
      return NextResponse.json(json, { status: response.status });
    } catch {
      return new NextResponse(text, { status: response.status });
    }
  } catch {
    return buildErrorResponse("Failed to reach backend.", 502);
  }
}
