require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") });
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const axios = require("axios");

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const SECRET = process.env.DISCORD_BOT_SECRET || "change-me-bot-secret";
const SITE_URL = process.env.SITE_URL || "http://localhost:3000";
const OWNER_ID = "1421909779583996025";

if (!TOKEN) { console.error("Missing DISCORD_BOT_TOKEN in .env.local"); process.exit(1); }

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.on("ready", () => console.log(`Logged in as ${client.user.tag}`));

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content !== "!panel") return;
  if (message.author.id !== OWNER_ID) return message.reply("Only the owner can use this command.");

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🎮 Konvy Accounts")
    .setDescription("Click the button below to get your one-time login code.")
    .setFooter({ text: "Code expires in 5 minutes" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("get_login_code")
      .setLabel("🔑 Get Login Code")
      .setStyle(ButtonStyle.Primary)
  );

  await message.channel.send({ embeds: [embed], components: [row] });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton() || interaction.customId !== "get_login_code") return;

  await interaction.deferReply({ ephemeral: true });

  try {
    const res = await axios.post(`${SITE_URL}/api/discord/generate-code`, {
      discord_id: interaction.user.id,
      username: interaction.user.username,
      display_name: interaction.user.displayName || interaction.user.globalName || interaction.user.username,
      avatar_url: interaction.user.displayAvatarURL({ size: 128 }),
      secret: SECRET,
    });

    const code = res.data.code;
    if (!code) throw new Error("No code returned");

    await interaction.user.send(`🔑 **Your login code:** ${code}\n\nEnter it at ${SITE_URL}/login-code`);
    await interaction.editReply({ content: "✅ Code sent to your DMs!" });
  } catch (err) {
    console.error("Panel error:", err.message);
    await interaction.editReply({ content: "❌ Failed to generate code. Try again later." });
  }
});

client.login(TOKEN);
