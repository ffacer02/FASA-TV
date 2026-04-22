export default async function handler(req, res) {
  const base = process.env.SUPABASE_URL + "/rest/v1/";

  const streamsRes = await fetch(base + "streams", {
    headers: {
      apikey: process.env.SUPABASE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
    },
  });

  const streams = await streamsRes.json();

  for (const s of streams) {
    let working = false;

    try {
      const r = await fetch(s.url, { method: "HEAD" });
      working = r.ok;
    } catch {
      working = false;
    }

    await fetch(base + `streams?id=eq.${s.id}`, {
      method: "PATCH",
      headers: {
        apikey: process.env.SUPABASE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        is_working: working,
      }),
    });
  }

  res.json({ done: true });
}
