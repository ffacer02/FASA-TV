import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const m3u = req.body;

    const lines = m3u.split("\n");

    let currentName = null;

    for (let line of lines) {
      if (line.startsWith("#EXTINF")) {
        currentName = line.split(",")[1]?.trim();
      }

      if (line.startsWith("http")) {
        const { data: channel } = await supabase
          .from("channels")
          .insert({
            name: currentName,
            group_name: "Ostalo"
          })
          .select()
          .single();

        await supabase.from("streams").insert({
          channel_id: channel.id,
          url: line,
          priority: 1
        });
      }
    }

    res.status(200).json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
