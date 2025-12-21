import { NextRequest, NextResponse } from "next/server";
import http from "http";
import https from "https";

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

const forwardGetWithBody = async (
  url: URL,
  body: unknown,
  headers: Record<string, string>
) => {
  const client = url.protocol === "https:" ? https : http;
  const payload = JSON.stringify(body ?? {});

  return new Promise<NextResponse>((resolve, reject) => {
    const request = client.request(
      {
        method: "GET",
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        headers: {
          ...headers,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (response) => {
        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          try {
            const json = data ? JSON.parse(data) : {};
            resolve(NextResponse.json(json, { status: response.statusCode || 200 }));
          } catch (error) {
            resolve(new NextResponse(data, { status: response.statusCode || 200 }));
          }
        });
      }
    );

    request.on("error", reject);
    request.write(payload);
    request.end();
  });
};

export async function POST(request: NextRequest, context: { params: { jobId: string } }) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    return buildErrorResponse("Missing API base URL.", 500);
  }

  const body = await request.json();
  const { jobId } = context.params;
  const targetUrl = new URL(`/api/jobs/${jobId}/applications`, baseUrl);

  const authHeader = request.headers.get("authorization");
  const headers: Record<string, string> = {};
  if (authHeader) {
    headers.Authorization = authHeader;
  }

  try {
    return await forwardGetWithBody(targetUrl, body, headers);
  } catch (error) {
    return buildErrorResponse("Failed to reach backend.", 502);
  }
}
