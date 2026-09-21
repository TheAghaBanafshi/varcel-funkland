// Vercel Serverless Function
// GET /api/list-songs
// لیست فایل‌های صوتی پوشه uploads رو از GitHub API می‌گیره

const GITHUB_REPO = "TheAghaBanafshi/all-repo";
const UPLOADS_PATH = "admin/html/funkland/uploads";
const AUDIO_EXTENSIONS = [".mp3", ".m4a", ".ogg", ".wav", ".webm", ".flac", ".aac", ".opus"];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Cache-Control", "public, max-age=60");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${UPLOADS_PATH}`;

    const headers = {
      "User-Agent": "FunkLand/1.0",
      "Accept": "application/vnd.github.v3+json",
    };
    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = "token " + process.env.GITHUB_TOKEN;
    }

    const r = await fetch(url, { headers });

    if (!r.ok) {
      return res.status(r.status).json({
        error: "GitHub API error",
        status: r.status,
        message: await r.text()
      });
    }

    const files = await r.json();

    const songs = files
      .filter(f => {
        if (f.type !== "file") return false;
        const name = f.name.toLowerCase();
        return AUDIO_EXTENSIONS.some(ext => name.endsWith(ext));
      })
      .map(f => {
        const baseName = f.name.replace(/\.[^.]+$/, "");
        return {
          name: baseName
            .replace(/[-_]+/g, " ")
            .replace(/\b\w/g, c => c.toUpperCase()),
          file: f.name,
          link: `https://cdn.jsdelivr.net/gh/${GITHUB_REPO}@main/${UPLOADS_PATH}/${f.name}`,
          added_at: 0,
          size: f.size,
        };
      });

    return res.status(200).json({ songs, count: songs.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
