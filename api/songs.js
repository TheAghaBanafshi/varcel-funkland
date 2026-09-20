// Vercel Serverless Function
// GET /api/songs
// songs.txt رو از GitHub می‌گیره و با CORS برمی‌گردونه

const SONGS_TXT_URL = "https://raw.githubusercontent.com/TheAghaBanafshi/all-repo/refs/heads/main/admin/html/funkland/songs.txt";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const r = await fetch(SONGS_TXT_URL, {
      headers: {
        "User-Agent": "FunkLand/1.0",
        "Accept": "text/plain,*/*",
      },
      // کش ۶۰ ثانیه‌ای برای سرعت
      cf: { cacheTtl: 60, cacheEverything: true },
    });

    if (!r.ok) {
      return res.status(r.status).send("github error: " + r.status);
    }

    const text = await r.text();

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=60");
    return res.status(200).send(text);
  } catch (e) {
    return res.status(500).send("error: " + e.message);
  }
}
