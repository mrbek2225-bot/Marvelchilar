# Marvel_chilar — YouTube → Telegram avtomatik xabar yuboruvchi

Bu skript Marvel YouTube kanal(lar)ini kuzatib boradi va yangi video chiqqanda avtomatik ravishda "Marvel_chilar" Telegram kanaliga xabar yuboradi.

## 1-qadam: Telegram bot yaratish

1. Telegram'da **@BotFather** ga yozing
2. `/newbot` buyrug'ini yuboring, nom va username bering
3. Sizga **bot token** beriladi (masalan: `123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`) — buni saqlab qo'ying
4. Botni **Marvel_chilar** kanalingizga **admin** qilib qo'shing (post qilish huquqi bilan)

## 2-qadam: YouTube API key olish

1. [Google Cloud Console](https://console.cloud.google.com/) ga kiring
2. Yangi loyiha yarating (masalan "marvel-chilar-bot")
3. Chap menyudan **APIs & Services → Library** ga o'ting
4. "YouTube Data API v3" ni qidirib, **Enable** qiling
5. **APIs & Services → Credentials → Create Credentials → API Key** bosing
6. API key'ni nusxalab oling

## 3-qadam: Loyihani sozlash

1. `.env.example` faylini `.env` deb nomlang
2. Ichiga o'z ma'lumotlaringizni kiriting:
   ```
   YOUTUBE_API_KEY=sizning_youtube_key
   TELEGRAM_BOT_TOKEN=sizning_bot_token
   TELEGRAM_CHANNEL_ID=@Marvel_chilar
   ```
3. `channels.json` faylida qaysi YouTube kanallarini kuzatishni xohlasangiz, shu yerga qo'shing. Hozircha faqat rasmiy **Marvel Entertainment** kanali qo'yilgan. Boshqa kanal qo'shish uchun uning Channel ID'sini toping (masalan https://commentpicker.com/youtube-channel-id.php orqali) va shunday formatda qo'shing:
   ```json
   [
     { "name": "Marvel Entertainment", "id": "UCvC4D8onUfXzvjTOM-dBfEA" },
     { "name": "Boshqa kanal", "id": "UC..." }
   ]
   ```

## 4-qadam: Kompyuterda sinab ko'rish

```bash
npm install
node --env-file=.env index.js
```

Birinchi ishga tushirishda xabar yuborilmaydi (faqat holat saqlanadi) — bu spam bo'lmasligi uchun. Keyingi safar yangi video chiqqanda avtomatik xabar keladi.

## 5-qadam: Doimiy avtomatik ishlashi uchun (GitHub Actions — bepul)

Toshkentda ba'zi xizmatlar bloklangani uchun, eng qulay yechim — GitHub Actions orqali bulutda ishlatish (bu Toshkentdan emas, GitHub serverlaridan ishlaydi):

1. Bu loyihani GitHub'ga yuklang (yangi repository yarating, kodni push qiling)
2. Repository **Settings → Secrets and variables → Actions** ga o'ting
3. Quyidagi 3 ta "secret"ni qo'shing:
   - `YOUTUBE_API_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHANNEL_ID`
4. Tayyor! `.github/workflows/check-youtube.yml` fayli avtomatik har 30 daqiqada ishga tushadi va yangi video bo'lsa, Telegram kanalingizga yuboradi.

## Muhim eslatmalar

- YouTube API kuniga **10,000 bepul unit** beradi — bu skript kunlik juda oz qismini sarflaydi (kanal boshiga ~2 unit har tekshiruvda), shuning uchun hech qachon to'lov kerak bo'lmaydi.
- `last-seen.json` fayli — har bir kanal uchun oxirgi ko'rilgan video ID'sini saqlaydi, shuning uchun bir xil video ikki marta yuborilmaydi.
