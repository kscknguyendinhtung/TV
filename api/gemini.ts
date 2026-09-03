import type { IncomingMessage, ServerResponse } from "http";
import { handleGeminiAction } from "../src/server/geminiBackend";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "25mb",
    },
    responseLimit: "25mb",
  },
  maxDuration: 60,
};

async function parseRequestBody(req: any): Promise<any> {
  if (req.body) {
    if (typeof req.body === "string") {
      try {
        return JSON.parse(req.body);
      } catch {
        return req.body;
      }
    }
    return req.body;
  }

  // Fallback if runtime didn't pre-parse body stream
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk: any) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(data);
      }
    });
    req.on("error", () => {
      resolve({});
    });
  });
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST.", code: "METHOD_NOT_ALLOWED", status: 405 });
    return;
  }

  try {
    const body = await parseRequestBody(req);

    const { action, payload } = body || {};
    if (!action) {
      res.status(400).json({ error: "Thiếu tham số 'action' trong yêu cầu", code: "INVALID_REQUEST", status: 400 });
      return;
    }

    const result = await handleGeminiAction(action, payload || {});
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Vercel Serverless Gemini API Error:", error);

    const errorMessage = error?.message || (typeof error === "string" ? error : JSON.stringify(error)) || "Internal Server Error";
    let statusCode = error?.status || error?.statusCode || 500;
    let errorCode = error?.code || "GEMINI_API_ERROR";

    // Detect common Gemini error patterns
    if (
      errorMessage.includes("GEMINI_API_KEY is not configured") || 
      errorMessage.includes("GEMINI_API_KEY_MISSING") ||
      errorMessage.includes("Chưa cấu hình")
    ) {
      statusCode = 500;
      errorCode = "GEMINI_API_KEY_MISSING";
    } else if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID")) {
      statusCode = 400;
      errorCode = "API_KEY_INVALID";
    } else if (errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("403")) {
      statusCode = 403;
      errorCode = "PERMISSION_DENIED";
    } else if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("429") || errorMessage.includes("Quota exceeded")) {
      statusCode = 429;
      errorCode = "RESOURCE_EXHAUSTED";
    } else if (errorMessage.includes("MODEL_NOT_FOUND") || errorMessage.includes("404")) {
      statusCode = 404;
      errorCode = "MODEL_NOT_FOUND";
    }

    res.status(statusCode >= 100 && statusCode < 600 ? statusCode : 500).json({
      error: errorMessage,
      message: errorMessage,
      code: errorCode,
      status: statusCode,
      details: error?.stack || null
    });
  }
}

