import "dotenv/config";
import { Client, GatewayIntentBits, Events, MessageFlags } from "discord.js";
import { getLastChecked, setLastChecked, getUserApiKey, setUserApiKey, deleteUserData } from "./storage.js";
import { summarizeMessages } from "./summarizer.js";
import { detectProviderName } from "./providers.js";

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
  postTopggStats();
  setInterval(postTopggStats, 30 * 60 * 1000);
});

async function postTopggStats() {
  if (!process.env.TOPGG_TOKEN) return;
  try {
    await fetch(`https://top.gg/api/bots/${client.user.id}/stats`, {
      method: "POST",
      headers: { Authorization: process.env.TOPGG_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({ server_count: client.guilds.cache.size }),
    });
  } catch (err) {
    console.error("Failed to post Top.gg stats:", err.message);
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "setup") {
    await handleSetup(interaction);
  } else if (interaction.commandName === "tldr") {
    await handleTldr(interaction);
  } else if (interaction.commandName === "deletedata") {
    await handleDeleteData(interaction);
  }
});

async function handleSetup(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const apiKey = interaction.options.getString("api_key");

  if (!apiKey || apiKey.length < 20) {
    return interaction.editReply({ content: "That doesn't look like a valid API key. Please check and try again." });
  }

  const providerName = detectProviderName(apiKey);
  setUserApiKey(interaction.user.id, apiKey);

  await interaction.editReply({
    content: `✅ API key saved (detected: **${providerName}**). You can now use \`/tldr\` in any channel.`,
  });
}

async function handleTldr(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const userApiKey = getUserApiKey(interaction.user.id);
  if (!userApiKey) {
    return interaction.editReply({
      content:
        "You haven't set up an API key yet. Run `/setup api_key:YOUR_KEY` first.\n\nGet a free key from:\n• **Anthropic:** https://console.anthropic.com\n• **OpenAI:** https://platform.openai.com\n• **Google:** https://aistudio.google.com",
    });
  }

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

    const summary = await summarizeMessages(formatted, channel.name, userApiKey);

    setLastChecked(userId, channel.id, Date.now());

    await interaction.editReply({
      content: `**TL;DR for #${channel.name}** (${formatted.length} messages since ${
        lastChecked ? new Date(lastChecked).toLocaleString() : `${DEFAULT_HOURS}h ago`
      })\n\n${summary}`,
    });
  } catch (err) {
    console.error(err);
    const isPermission = err.code === 50001 || err.code === 50013;
    await interaction.editReply({
      content: isPermission
        ? "I don't have permission to read message history in this channel. Ask a server admin to grant me **View Channel** and **Read Message History**."
        : "Something went wrong generating the summary. Your API key may be invalid or over quota — you can update it with `/setup`.",
    });
  }
}

async function handleDeleteData(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  deleteUserData(interaction.user.id);
  await interaction.editReply({
    content: "✅ All your data has been deleted (API key + channel history). You'll need to run `/setup` again to use `/tldr`.",
  });
}

function describeMessage(message) {
  const parts = [];

  if (message.content) parts.push(message.content);

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
