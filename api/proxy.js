// Vercel Serverless Function
// GET /api/proxy?url=ENCODED_LINK
// فقط اگه لینک از jsDelivr نبود، از این استفاده می‌شه

const ALLOWED_HOSTS = [
  "cdn.jsdelivr.net",
  "raw.githubusercontent.com",
  "cdn.imgurl.ir",
  "imgurl.ir",
  "files.catbox.moe",
  "catbox.moe",
  "archive.org",
  "ia801504.us.archive.org",
  "ia601504.us.archive.org",
];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges, Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const target = req.query.url;
  if (!target) return res.status(400).send("missing url");

  let targetUrl;
  try { targetUrl = new URL(target); } catch {
    return res.status(400).send("invalid url");
  }

  if (!ALLOWED_HOSTS.includes(targetUrl.hostname)) {
    return res.status(403).send("host not allowed: " + targetUrl.hostname);
  }

  try {
    const headers = {
      "User-Agent": "Mozilla/5.0 FunkLandProxy/1.0",
      "Accept": "*/*",
    };
    if (req.headers.range) headers["Range"] = req.headers.range;

    const upstream = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      redirect: "follow",
    });

    const contentType = upstream.headers.get("content-type") || guessAudioMime(targetUrl.pathname);
    res.setHeader("Content-Type", contentType);

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) res.setHeader("Content-Length", contentLength);

    const contentRange = upstream.headers.get("content-range");
    if (contentRange) res.setHeader("Content-Range", contentRange);

    res.setHeader("Accept-Ranges", "bytes");
    res.status(upstream.status);

    if (!upstream.body) return res.end();

    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (e) {
    res.status(500).send("proxy error: " + e.message);
  }
}

function guessAudioMime(path) {
  const p = path.toLowerCase();
  if (p.endsWith(".m4a") || p.endsWith(".mp4")) return "audio/mp4";
  if (p.endsWith(".mp3")) return "audio/mpeg";
  if (p.endsWith(".ogg")) return "audio/ogg";
  if (p.endsWith(".wav")) return "audio/wav";
  if (p.endsWith(".webm")) return "audio/webm";
  return "audio/mpeg";
}
