export default async function handler(req, res) {
  const r = await fetch(
    process.env.SUPABASE_URL + "/rest/v1/channels?active=eq.true",
    {
      headers: {
        apikey: process.env.SUPABASE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
      },
    }
  );

  const channels = await r.json();

  let m3u = "#EXTM3U\n";

  for (const ch of channels) {
    const streamsRes = await fetch(
      process.env.SUPABASE_URL +
        `/rest/v1/streams?channel_id=eq.${ch.id}&is_working=eq.true&order=priority.asc`,
      {
        headers: {
          apikey: process.env.SUPABASE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
        },
      }
    );

    const streams = await streamsRes.json();

    streams.forEach((s) => {
      m3u += `#EXTINF:-1 group-title="${ch.group_name}",${ch.name}\n`;
      m3u += `${s.url}\n`;
    });
  }

  res.setHeader("Content-Type", "application/x-mpegURL");
  res.send(m3u);
}
