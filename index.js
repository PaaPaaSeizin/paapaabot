const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const http = require('http');

// =========================================================
// ★ 設定情報（GitHub漏洩防止のため環境変数から読み込み）
// =========================================================
const BOT_TOKEN = process.env.BOT_TOKEN || "ここにBotトークン"; 
const WORKER_URL = process.env.WORKER_URL || "https://<YOUR-WORKER-NAME>.<YOUR-SUBDOMAIN>.workers.dev/"; 
const PREFIX = "p!";

// =========================================================
// Discord Bot クライアント初期化
// =========================================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Bot 起動時（オンライン化）の処理
client.once('ready', () => {
  console.log(`[環境A] Botがログインしました: ${client.user.tag}`);
  
  client.user.setPresence({
    activities: [{ name: '/help でコマンド確認 | 稼働中', type: ActivityType.Playing }],
    status: 'online',
  });
});

// メッセージ受信（p! コマンドの監視と転送）
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  console.log(`[環境A] p! コマンド検知: ${message.content} (送信者: ${message.author.tag})`);

  const payload = {
    type: "PREFIX_COMMAND",
    prefix: PREFIX,
    content: message.content,
    channel_id: message.channelId,
    guild_id: message.guildId,
    author: {
      id: message.author.id,
      username: message.author.username,
      discriminator: message.author.discriminator
    }
  };

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-From": "Bot-Gateway-Environment-A"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`[環境A] Workersへの転送失敗: ${response.status}`);
    }
  } catch (error) {
    console.error("[環境A] Workersへの転送エラー:", error);
  }
});

client.login(BOT_TOKEN);

// =========================================================
// Web サーバー（ヘルスチェック / Keep-Alive 用）
// =========================================================
const PORT = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Bot Gateway (Environment A) is Running!');
});

server.listen(PORT, () => {
  console.log(`[環境A] ヘルスチェック用Webサーバーがポート ${PORT} で起動しました`);
});
