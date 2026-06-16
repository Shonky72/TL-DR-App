import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * @param {{author: string, content: string, timestamp: Date}[]} messages
 * @param {string} channelName
 */
export async function summarizeMessages(messages, channelName) {
  if (messages.length === 0) {
    return "No new messages since you last checked.";
  }

  const transcript = messages
    .map((m) => `[${m.timestamp.toLocaleString()}] ${m.author}: ${m.content}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `You are summarizing a Discord channel called #${channelName} for someone who was away. Below is the chat transcript since they last checked (${messages.length} messages). Write a concise TL;DR: group by topic/conversation thread, call out anything that seems important, mentions of the user, decisions made, or questions directed at them. Keep it skimmable, use bullet points, and don't pad it out.\n\nTranscript:\n${transcript}`,
      },
    ],
  });

  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}
