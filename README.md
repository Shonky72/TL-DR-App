# TL;DR Bot

A Discord bot that summarizes messages you missed since you last checked a channel, powered by your own AI API key.

## Add to your server

**[Click here to invite TL;DR Bot](https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=68608&scope=bot%20applications.commands)**

> Replace `YOUR_CLIENT_ID` with your Discord application ID before sharing this link.

### Getting started (3 steps)

1. Add the bot to your server using the invite link above
2. Run `/setup api_key:YOUR_KEY` — the bot detects your provider automatically
3. Run `/tldr` in any channel to catch up on what you missed

### Where to get an API key

| Provider | Link | Notes |
|----------|------|-------|
| Anthropic (Claude) | https://console.anthropic.com | Recommended |
| OpenAI (GPT) | https://platform.openai.com | |
| Google (Gemini) | https://aistudio.google.com | Free tier available |
| Others | Any OpenAI-compatible API | Groq, Mistral, Together, etc. |

### Commands

| Command | Description |
|---------|-------------|
| `/setup api_key:YOUR_KEY` | Register your AI API key (run once) |
| `/tldr` | Summarize messages since you last checked |
| `/tldr hours:6` | Look back 6 hours (first run in a channel only) |
| `/deletedata` | Permanently delete all your stored data |

---

## Privacy

[Privacy Policy](https://shonky72.github.io/TL-DR-App/privacy)

Your API key and channel timestamps are stored privately on Fly.io infrastructure. Message content is never stored — it is fetched on demand, summarised, and discarded. Run `/deletedata` at any time to erase everything.

---

## Self-hosting / development

### Prerequisites
- Node.js 20+
- A Discord bot application ([Discord Developer Portal](https://discord.com/developers/applications))
- An AI API key of your choice

### Setup

```powershell
npm install
cp .env.example .env
# Fill in DISCORD_TOKEN and DISCORD_CLIENT_ID in .env
npm run register   # register slash commands
npm start
```

### Deploying to Fly.io

```powershell
fly launch --no-deploy
fly volumes create tldr_data --size 1
fly secrets set DISCORD_TOKEN=xxx DISCORD_CLIENT_ID=xxx
fly deploy
```

### Required bot permissions
- View Channels
- Read Message History
- Send Messages

### Required privileged intents (Discord Developer Portal → Bot)
- Message Content Intent
