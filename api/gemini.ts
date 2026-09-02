import type { IncomingMessage, ServerResponse } from "http";
import { handleGeminiAction } from "../src/server/geminiBackend";

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
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {}
    }

    const { action, payload } = body || {};
    if (!action) {
      res.status(400).json({ error: "Missing 'action' in request body" });
      return;
    }

    const result = await handleGeminiAction(action, payload || {});
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Vercel Serverless Gemini API Error:", error);
    res.status(500).json({ error: error?.message || "Internal Server Error" });
  }
}
