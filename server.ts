import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { handleGeminiAction } from "./src/server/geminiBackend";

dotenv.config();

const app = express();
const PORT = 3000;

// In-memory cache for generated TTS audio to provide instant playback and low latency
const ttsCache = new Map<string, { buffer: Buffer; contentType: string }>();

// Enable JSON body parsing for API endpoints
app.use(express.json({ limit: "50mb" }));

// Server-side Gemini API proxy (Keeps API key secure on server)
app.post("/api/gemini", async (req, res) => {
  try {
    const { action, payload } = req.body || {};
    if (!action) {
      return res.status(400).json({ error: "Missing 'action' in request body" });
    }
    const result = await handleGeminiAction(action, payload || {});
    res.json(result);
  } catch (error: any) {
    console.error("Server Gemini API Error:", error);
    res.status(500).json({ error: error?.message || "Internal Server Error" });
  }
});

// TTS Proxy endpoint that works universally across development and production
app.get("/api/tts", async (req, res) => {
  try {
    const text = (req.query.text as string) || "";
    const lang = (req.query.lang as string) || "vi";

    if (!text.trim()) {
      return res.status(400).send("Missing text parameter");
    }

    const cleanText = text.trim().slice(0, 300);
    const targetLang = lang.toLowerCase().startsWith("zh")
      ? "zh-CN"
      : lang.toLowerCase().startsWith("en")
      ? "en"
      : "vi";

    const cacheKey = `${targetLang}:${cleanText}`;
    if (ttsCache.has(cacheKey)) {
      const cached = ttsCache.get(cacheKey)!;
      res.setHeader("Content-Type", cached.contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(cached.buffer);
    }

    // Fetch from Google Translate TTS API with realistic browser headers
    const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${targetLang}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;

    const response = await fetch(googleUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Referer": "https://translate.google.com/",
        "Accept": "*/*"
      }
    });

    if (!response.ok) {
      return res.status(response.status).send("Failed to fetch audio from TTS provider");
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "audio/mpeg";

    // Cache item (keep cache bounded to 1000 items)
    if (ttsCache.size > 1000) {
      const firstKey = ttsCache.keys().next().value;
      if (firstKey) ttsCache.delete(firstKey);
    }
    ttsCache.set(cacheKey, { buffer, contentType });

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error("TTS Endpoint Error:", error);
    res.status(500).send("Internal server error during speech synthesis");
  }
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start();
