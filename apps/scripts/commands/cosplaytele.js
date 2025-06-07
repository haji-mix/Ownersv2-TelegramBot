const meta = {
  name: "cosplaytele",
  version: "1.4.0",
  aliases: ["cp", "cosplayer"],
  description: "Get random 18+ cosplay results (with optional search term)",
  author: "Kenneth Panio",
  prefix: "both",
  category: "Media",
  type: "anyone",
  cooldown: 5,
  guide: "Usage: !cosplay [search term]\nExamples:\n!cosplay Ganyu - Random Ganyu cosplay\n!cosplay - Completely random cosplay"
};

async function onStart({ bot, args, message, msg, usages }) {
  try {
    const searchTerm = args.join(" ");
    const loadingMsg = await message.reply("🎲 Selecting random cosplay...");

    const apiUrl = `https://www.haji-mix-api.gleeze.com/api/cosplaytele?search=${encodeURIComponent(searchTerm || "")}&stream=false`;
    
    const response = await fetch(apiUrl);
    
    const data = await response.json();

    if (!data.result || data.result.length === 0) {
      await bot.editMessageText("No matching cosplay found.", {
        chat_id: msg.chat.id,
        message_id: loadingMsg.message_id
      });
      return;
    }

    // Always pick random result from filtered results
    const cosplay = data.result[Math.floor(Math.random() * data.result.length)];
    
    // Prepare caption
    let caption = `🎲 *Random Cosplay*\n`;
    if (searchTerm) caption += `🔍 *Search Term:* ${searchTerm}\n`;
    caption += `🎭 *Title:* ${cosplay.title}\n`;
    caption += `👤 *Cosplayer:* ${cosplay.cosplayer}\n`;
    caption += `🎮 *Character:* ${cosplay.character}\n`;
    
    if (cosplay.downloadLinks?.length > 0) {
      caption += `\n🔐 *Password: ${data.password}*`;
      caption += "\n📥 *Download Links:*\n";
      caption += cosplay.downloadLinks.map(link => `- ${link}`).join("\n");
    }

    // Send all images as single media group (up to Telegram's 10-image limit)
    const mediaGroup = cosplay.images.slice(0, 10).map((img, idx) => ({
      type: "photo",
      media: img,
      caption: idx === 0 ? caption : "",
      parse_mode: "Markdown"
    }));

    await bot.deleteMessage(msg.chat.id, loadingMsg.message_id);
    await bot.sendMediaGroup(msg.chat.id, mediaGroup);

  } catch (error) {
    console.error("Cosplay command error:", error);
    message.reply("❌ Error fetching cosplay. Try again!");
  }
}

module.exports = { meta, onStart };