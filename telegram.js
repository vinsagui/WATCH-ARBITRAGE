const TelegramBot = require('node-telegram-bot-api');

let bot = null;

function getBot() {
  if (!bot) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
  }
  return bot;
}

async function sendAlert(listing, medianPrice, discount) {
  const pct = Math.round(discount * 100);
  const message =
    `🎯 Bonne affaire détectée (-${pct}%)\n\n` +
    `${listing.title}\n` +
    `Prix : ${listing.price}€ (médian estimé : ${medianPrice.toFixed(0)}€)\n` +
    `État : ${listing.condition_tag}\n` +
    `🔗 ${listing.url}`;

  await getBot().sendMessage(process.env.TELEGRAM_CHAT_ID, message);
}

module.exports = { sendAlert };
