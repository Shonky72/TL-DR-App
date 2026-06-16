import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const commands = [
  new SlashCommandBuilder()
    .setName("tldr")
    .setDescription("Summarize messages you've missed in this channel")
    .addIntegerOption((option) =>
      option
        .setName("hours")
        .setDescription("How far back to look if you've never checked this channel before (default 24)")
        .setMinValue(1)
        .setMaxValue(168)
    )
    .toJSON(),
];

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

try {
  console.log("Registering slash commands...");
  await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
    body: commands,
  });
  console.log("Slash commands registered successfully.");
} catch (error) {
  console.error(error);
}
