const DISCORD_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1570531324928991282/mQk9S6KnIIODiak1_hYGId34i1SDiXcpEZU2va-IkqTLHG2ahFBaT4GP_uiOt9tsda0d';

interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  footer?: { text: string };
  timestamp?: string;
}

const COLORS = {
  blue: 0x3b82f6,
  green: 0x22c55e,
  red: 0xef4444,
  orange: 0xf97316,
  yellow: 0xeab308,
  purple: 0xa855f7,
  emerald: 0x10b981,
  rose: 0xf43f5e,
  sky: 0x0ea5e9,
};

export async function sendDiscordWebhook(
  title: string,
  description: string,
  fields: DiscordEmbedField[] = [],
  color: number = COLORS.sky,
): Promise<void> {
  try {
    const embed: DiscordEmbed = {
      title,
      description,
      color,
      fields: fields.length > 0 ? fields : undefined,
      footer: { text: 'E58 ROMÂNIA ROLEPLAY · Staff Portal' },
      timestamp: new Date().toISOString(),
    };
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch {
    // Webhook failures should not block the action
  }
}

export { COLORS as DISCORD_COLORS };
