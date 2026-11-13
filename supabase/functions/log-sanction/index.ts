import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Api-Key",
};

const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1570531324928991282/mQk9S6KnIIODiak1_hYGId34i1SDiXcpEZU2va-IkqTLHG2ahFBaT4GP_uiOt9tsda0d";

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const VALID_SANCTION_TYPES = ["kick", "temp_ban", "permanent_ban", "warning", "mute", "ban"];

const SANCTION_LABELS: Record<string, string> = {
  kick: "Kick",
  temp_ban: "T-Ban",
  permanent_ban: "P-Ban",
  warning: "Avertisment",
  mute: "Mute",
  ban: "Ban",
};

async function sendDiscordWebhook(
  title: string,
  description: string,
  fields: { name: string; value: string; inline?: boolean }[],
  color: number,
): Promise<void> {
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title,
          description,
          color,
          fields: fields.length > 0 ? fields : undefined,
          footer: { text: "E58 ROMÂNIA ROLEPLAY · Staff Portal" },
          timestamp: new Date().toISOString(),
        }],
      }),
    });
  } catch {
    // ignore webhook errors
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get("X-Api-Key");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const keyHash = await sha256(apiKey);
    const { data: keyRecord, error: keyError } = await supabase
      .from("api_keys")
      .select("id, is_active, issuer_profile_id")
      .eq("key_hash", keyHash)
      .maybeSingle();

    if (keyError || !keyRecord) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!keyRecord.is_active) {
      return new Response(
        JSON.stringify({ error: "API key is disabled" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { roblox_name, roblox_id, sanction_type, reason, duration, proof_url, issued_by_name } = body;

    if (!roblox_name || !sanction_type || !reason) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: roblox_name, sanction_type, reason" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!VALID_SANCTION_TYPES.includes(sanction_type)) {
      return new Response(
        JSON.stringify({ error: `Invalid sanction_type. Allowed: ${VALID_SANCTION_TYPES.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let issuedById: string | null = null;
    let issuedByName: string | null = issued_by_name || null;

    if (keyRecord.issuer_profile_id) {
      const { data: profile } = await supabase
        .from("staff_profiles")
        .select("id, roblox_name, user_id")
        .eq("id", keyRecord.issuer_profile_id)
        .maybeSingle();
      if (profile) {
        issuedById = profile.user_id;
        issuedByName = profile.roblox_name;
      }
    }

    const { data: sanction, error: insertError } = await supabase
      .from("sanctions")
      .insert({
        roblox_name,
        roblox_id: roblox_id || null,
        sanction_type,
        reason,
        duration: duration || null,
        proof_url: proof_url || null,
        issued_by: issuedById,
        issued_by_name: issuedByName,
      })
      .select()
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: "Failed to log sanction" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase.from("logs").insert({
      log_type: "sanction",
      roblox_name,
      staff_name: issuedByName,
      details: `${sanction_type}: ${reason}${duration ? ` (${duration})` : ""}`,
    });

    await sendDiscordWebhook(
      "Sanctiune Jucator (API)",
      `**${roblox_name}** a primit sanctiune de **${issuedByName || "Server"}**`,
      [
        { name: "Tip", value: SANCTION_LABELS[sanction_type] || sanction_type, inline: true },
        { name: "Motiv", value: reason },
        ...(duration ? [{ name: "Durata", value: duration, inline: true }] : []),
        ...(proof_url ? [{ name: "Dovada", value: proof_url }] : []),
      ],
      0xef4444,
    );

    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", keyRecord.id);

    return new Response(
      JSON.stringify({ success: true, id: sanction.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
