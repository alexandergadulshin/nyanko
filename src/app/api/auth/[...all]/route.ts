import { auth } from "~/lib/auth";

export async function GET(request: Request) {
  try {
    console.log("Auth GET request:", request.url);
    const response = await auth.handler(request);
    console.log("Auth GET response status:", response.status);
    return response;
  } catch (error) {
    console.error("Auth GET error:", error);
    return new Response(`Auth GET Error: ${String(error)}`, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log("Auth POST request:", request.url);
    const response = await auth.handler(request);
    console.log("Auth POST response status:", response.status);
    return response;
  } catch (error) {
    console.error("Auth POST error:", error);
    return new Response(`Auth POST Error: ${String(error)}`, { status: 500 });
  }
}