import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function cleanName(name) {
  return name
    .replace(/\bHD\b|\bFHD\b|\bSD\b|\|\|.*$/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function detectGroup(name) {
  name = name.toLowerCase();

  if (name.includes("sport")) return "Sport";
  if (name.includes("arena") || name.includes("sk")) return "Sport";
  if (name.includes("pink") || name.includes("rts") || name.includes("hbo"))
    return "Domaci";

  return "Strani";
}

export default async function handler(req, res) {
  try {
    const m3uUrl = "https://raw.githubusercontent.com/ffacer02/FASA-TV/main/lista.m3u";

    const txt = await fetch(m3uUrl).then(r => r.text());
    const lines = txt.split("\n");

    let currentName = "";

    for (let line of lines) {
      line = line.trim();

      if (line.startsWith("#EXTINF")) {
        currentName = cleanName(line.split(",")[1] || "Unknown");
      }

      if (line.startsWith("http")) {
        let group = detectGroup(currentName);

        // provjeri postoji li kanal
        let { data: existing } = await supabase
          .from("channels")
          .select("*")
          .eq("name", currentName)
          .limit(1);

        let channelId;

        if (existing.length > 0) {
          channelId = existing[0].id;
        } else {
          const { data: newChannel } = await supabase
            .from("channels")
            .insert({
              name: currentName,
              group_name: group,
            })
            .select()
            .single();

          channelId = newChannel.id;
        }

        // dodaj stream ako već ne postoji
        const { data: existingStream } = await supabase
          .from("streams")
          .select("*")
          .eq("url", line)
          .limit(1);

        if (!existingStream.length) {
          await supabase.from("streams").insert({
            channel_id: channelId,
            url: line,
            priority: 1,
            is_working: true,
          });
        }
      }
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
