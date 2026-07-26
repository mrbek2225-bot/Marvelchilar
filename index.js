// Marvel_chilar uchun YouTube -> Telegram avtomatik xabar yuboruvchi skript
// Bu skript kuzatilayotgan YouTube kanal(lar)ida yangi video chiqqanini tekshiradi
// va topilsa, Telegram kanaliga avtomatik post qiladi.

const fs = require("fs");
const path = require("path");

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID; // masalan: @Marvel_chilar

const STATE_FILE = path.join(__dirname, "last-seen.json");

// Kuzatiladigan kanallar ro'yxati (config.json'dan o'qiladi)
const CHANNELS = require("./channels.json");

if (!YOUTUBE_API_KEY || !TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
  console.error("XATO: .env faylida YOUTUBE_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID to'ldirilganligini tekshiring.");
  process.exit(1);
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
  }
  return {};
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function getLatestVideo(channelId) {
  // uploads playlist orqali olish - search.list dan arzonroq (1 unit vs 100 unit)
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
  const channelRes = await fetch(channelUrl);
  const channelData = await channelRes.json();

  if (!channelData.items || channelData.items.length === 0) {
    console.error(`Kanal topilmadi: ${channelId}`);
    return null;
  }

  const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

  const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=1&key=${YOUTUBE_API_KEY}`;
  const playlistRes = await fetch(playlistUrl);
  const playlistData = await playlistRes.json();

  if (!playlistData.items || playlistData.items.length === 0) return null;

  const latest = playlistData.items[0].snippet;
  return {
    videoId: latest.resourceId.videoId,
    title: latest.title,
    thumbnail: latest.thumbnails?.high?.url || latest.thumbnails?.default?.url,
    publishedAt: latest.publishedAt,
  };
}

async function sendToTelegram(channelName, video) {
  const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
  const caption = `🎬 *${channelName}* dan yangi video!\n\n*${video.title}*\n\n${videoUrl}`;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHANNEL_ID,
      photo: video.thumbnail,
      caption: caption,
      parse_mode: "Markdown",
    }),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error("Telegram xatosi:", data);
    // Agar rasm yuborishda xato bo'lsa, oddiy matn sifatida yuboramiz
    const fallbackUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(fallbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHANNEL_ID,
        text: caption,
        parse_mode: "Markdown",
      }),
    });
  } else {
    console.log(`✅ Yuborildi: ${channelName} - ${video.title}`);
  }
}

async function main() {
  const state = loadState();
  let stateChanged = false;

  for (const channel of CHANNELS) {
    console.log(`Tekshirilmoqda: ${channel.name}...`);
    try {
      const latest = await getLatestVideo(channel.id);
      if (!latest) continue;

      const lastSeenId = state[channel.id];

      if (lastSeenId !== latest.videoId) {
        // Birinchi ishga tushirishda spam bo'lmasligi uchun, faqat holat mavjud bo'lsa xabar yuboramiz
        if (lastSeenId !== undefined) {
          await sendToTelegram(channel.name, latest);
        } else {
          console.log(`Birinchi marta ishga tushirilmoqda - ${channel.name} uchun holat saqlanmoqda, xabar yuborilmaydi.`);
        }
        state[channel.id] = latest.videoId;
        stateChanged = true;
      } else {
        console.log(`Yangilik yo'q: ${channel.name}`);
      }
    } catch (err) {
      console.error(`Xato (${channel.name}):`, err.message);
    }
  }

  if (stateChanged) {
    saveState(state);
  }
}

main();
