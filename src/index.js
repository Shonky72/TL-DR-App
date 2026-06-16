import "dotenv/config";
import { Client, GatewayIntentBits, Events, MessageFlags } from "discord.js";
import { getLastChecked, setLastChecked } from "./storage.js";
import { summarizeMessages } from "./summarizer.js";

const MAX_MESSAGES = 500;
const DEFAULT_HOURS = 24;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "tldr") return;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const channel = interaction.channel;
  const userId = interaction.user.id;

  const lastChecked = getLastChecked(userId, channel.id);
  const since = lastChecked
    ? lastChecked
    : Date.now() - (interaction.options.getInteger("hours") ?? DEFAULT_HOURS) * 60 * 60 * 1000;

  try {
    const messages = await fetchMessagesSince(channel, since);
    const formatted = messages
      .filter((m) => !m.author.bot)
      .map((m) => ({
        author: m.member?.displayName ?? m.author.username,
        content: describeMessage(m),
        timestamp: m.createdAt,
      }));

    const summary = await summarizeMessages(formatted, channel.name);

    setLastChecked(userId, channel.id, Date.now());

    await interaction.editReply({
      content: `**TL;DR for #${channel.name}** (${formatted.length} messages since ${
        lastChecked ? new Date(lastChecked).toLocaleString() : `${DEFAULT_HOURS}h ago`
      })\n\n${summary}`,
    });
  } catch (err) {
    console.error(err);
    await interaction.editReply({
      content: "Something went wrong generating the summary. Please try again.",
    });
  }
});

/**
 * Build a text description of a message, including any text content,
 * attachments (images/GIFs/files), and link embeds.
 */
function describeMessage(message) {
  const parts = [];

  if (message.content) {
    parts.push(message.content);
  }

  for (const attachment of message.attachments.values()) {
    const contentType = attachment.contentType ?? "";
    let kind = "file";
    if (contentType.startsWith("image/gif")) kind = "GIF";
    else if (contentType.startsWith("image/")) kind = "image";
    else if (contentType.startsWith("video/")) kind = "video";
    parts.push(`[shared ${kind}: ${attachment.name}]`);
  }

  for (const embed of message.embeds) {
    const label = embed.title ?? embed.url ?? "link";
    parts.push(`[link: ${label}]`);
  }

  return parts.length > 0 ? parts.join(" ") : "[non-text content]";
}

/**
 * Fetch messages newer than `since` (ms epoch), oldest-first, capped at MAX_MESSAGES.
 */
async function fetchMessagesSince(channel, since) {
  const collected = [];
  let before = undefined;

  while (collected.length < MAX_MESSAGES) {
    const batch = await channel.messages.fetch({ limit: 100, before });
    if (batch.size === 0) break;

    const batchArray = [...batch.values()];
    let reachedCutoff = false;

    for (const msg of batchArray) {
      if (msg.createdTimestamp <= since) {
        reachedCutoff = true;
        break;
      }
      collected.push(msg);
    }

    if (reachedCutoff) break;

    before = batchArray[batchArray.length - 1].id;
  }

  return collected.reverse();
}

client.login(process.env.DISCORD_TOKEN);
