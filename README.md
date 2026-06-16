# TL;DR Discord Bot

A Discord bot that summarizes messages you've missed since you last checked a channel, using Claude.

## How it works

Run `/tldr` in any channel the bot is in. It looks at messages since the last time *you* ran `/tldr` there (or the last N hours if it's your first time), sends them to Claude, and replies privately to you with a bullet-point summary.

## Setup

### 1. Create a Discord bot application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**.
2. Name it (e.g. "TL;DR Bot") and create it.
3. Go to the **Bot** tab, click **Reset Token**, and copy the token.
4. Under **Privileged Gateway Intents**, toggle **Message Content Intent** ON and save. This is required for `/tldr` to read the actual text of messages — without it, Discord redacts message content and the bot can only see attachments/embeds.
5. Go to **OAuth2 > General** and copy the **Application ID** (this is your `DISCORD_CLIENT_ID`).

### 2. Invite the bot to your server

1. Go to **OAuth2 > URL Generator**.
2. Select scopes: `bot` and `applications.commands`.
3. Select bot permissions: `View Channels`, `Read Message History`, `Send Messages`.
4. Open the generated URL and invite the bot to your server (requires "Manage Server" permission on that server).

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in:

```
DISCORD_TOKEN=<bot token from step 1>
DISCORD_CLIENT_ID=<application id from step 1>
ANTHROPIC_API_KEY=<your Anthropic API key>
```

### 4. Register the slash command

```
npm run register
```

(Re-run this any time you change `src/registerCommands.js`.)

### 5. Run the bot

```
npm start
```

## Usage

In any channel the bot can see, type:

- `/tldr` — summarize everything since you last ran `/tldr` here (defaults to last 24h on first run)
- `/tldr hours:6` — on first run in a channel, look back 6 hours instead of 24

The reply is ephemeral (only visible to you).

## Notes / limits

- Fetches a maximum of 500 messages per summary to keep things fast and cheap.
- Each user's "last checked" time is tracked per-channel in `data/lastChecked.json`.
- This is a real bot account, not a self-bot, so it only sees channels it's been invited into.
