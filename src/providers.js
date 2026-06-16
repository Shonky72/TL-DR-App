import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

function detectProvider(apiKey) {
  if (apiKey.startsWith("sk-ant-")) return "anthropic";
  if (apiKey.startsWith("AIza")) return "google";
  return "openai";
}

export function detectProviderName(apiKey) {
  const p = detectProvider(apiKey);
  return p === "anthropic" ? "Anthropic" : p === "google" ? "Google" : "OpenAI / compatible";
}

const PROMPT = (channelName, count) => {
  const tight = count > 150
    ? " This is a high-volume channel so be extra concise — max 2 bullet points per topic, no filler, prioritise decisions and action items."
    : "";
  return `You are summarizing a Discord channel called #${channelName} for someone who was away (${count} messages). Write a concise TL;DR: group by topic/conversation thread, call out anything important, mentions, decisions, or questions directed at them. Keep it skimmable with bullet points. Don't pad it out.${tight}`;
};

export async function summarizeWithKey(messages, channelName, apiKey) {
  if (messages.length === 0) return "No new messages since you last checked.";

  const transcript = messages
    .map((m) => `[${m.timestamp.toLocaleString()}] ${m.author}: ${m.content}`)
    .join("\n");

  const provider = detectProvider(apiKey);

  if (provider === "anthropic") {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1800,
      messages: [{ role: "user", content: `${PROMPT(channelName, messages.length)}\n\nTranscript:\n${transcript}` }],
    });
    return res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  }

  if (provider === "google") {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const res = await model.generateContent(`${PROMPT(channelName, messages.length)}\n\nTranscript:\n${transcript}`);
    return res.response.text();
  }

  // OpenAI or OpenAI-compatible
  const client = new OpenAI({ apiKey });
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1800,
    messages: [{ role: "user", content: `${PROMPT(channelName, messages.length)}\n\nTranscript:\n${transcript}` }],
  });
  return res.choices[0].message.content ?? "";
}
