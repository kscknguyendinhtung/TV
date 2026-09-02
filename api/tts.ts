export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const text = (req.query?.text as string) || "";
    const lang = (req.query?.lang as string) || "vi";

    if (!text.trim()) {
      res.status(400).send("Missing text parameter");
      return;
    }

    const cleanText = text.trim().slice(0, 300);
    const targetLang = lang.toLowerCase().startsWith("zh")
      ? "zh-CN"
      : lang.toLowerCase().startsWith("en")
      ? "en"
      : "vi";

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
      res.status(response.status).send("Failed to fetch audio");
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "audio/mpeg";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (error: any) {
    console.error("Vercel TTS Error:", error);
    res.status(500).send("TTS generation error");
  }
}
