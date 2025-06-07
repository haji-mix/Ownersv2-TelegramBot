const meta = {
  name: "cosplaytele",
  version: "1.4.0",
  aliases: ["cp", "cosplayer"],
  description: "Get random 18+ cosplay results (with optional search term)",
  author: "Kenneth Panio",
  prefix: "both",
  category: "nsfw",
  type: "anyone",
  cooldown: 5,
  guide: "[search term]"
};

async function fetchCosplay(searchTerm = "") {
  const apiUrl = `https://www.haji-mix-api.gleeze.com/api/cosplaytele?search=${encodeURIComponent(searchTerm)}&stream=false`;
  const response = await fetch(apiUrl);
  return await response.json();
}

async function sendCosplayResult(bot, chatId, data, searchTerm, replyToMsgId = null) {
  if (!data.result || data.result.length === 0) {
    return { error: "No matching cosplay found." };
  }

  const cosplay = data.result[Math.floor(Math.random() * data.result.length)];
  
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

  if (cosplay.images.length === 1) {
    const message = await bot.sendPhoto(chatId, cosplay.images[0], {
      caption: caption,
      parse_mode: "Markdown",
      reply_to_message_id: replyToMsgId,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔁 Get Another",
              callback_data: `cosplay_refresh:${searchTerm}`
            }
          ]
        ]
      }
    });
    return { success: true, messageId: message.message_id };
  }

  const mediaGroup = cosplay.images.slice(0, 10).map((img, idx) => ({
    type: "photo",
    media: img,
    caption: idx === 0 ? caption : "",
    parse_mode: "Markdown"
  }));

  await bot.sendMediaGroup(chatId, mediaGroup);
  const buttonMsg = await bot.sendMessage(chatId, "Want another cosplay?", {
    reply_to_message_id: replyToMsgId,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🔁 Get Another",
            callback_data: `cosplay_refresh:${searchTerm}`
          }
        ]
      ]
    }
  });

  return { success: true, messageId: buttonMsg.message_id };
}

async function onStart({ bot, args, message, msg, usages }) {
  try {
    const searchTerm = args.join(" ").trim();
    const loadingMsg = await message.reply("🎲 Selecting random cosplay...");

    const data = await fetchCosplay(searchTerm);
    
    if (!data.result || data.result.length === 0) {
      await bot.editMessageText("No matching cosplay found.", {
        chat_id: msg.chat.id,
        message_id: loadingMsg.message_id
      });
      return;
    }

    await bot.deleteMessage(msg.chat.id, loadingMsg.message_id).catch(console.error);

    await sendCosplayResult(bot, msg.chat.id, data, searchTerm, msg.message_id);

  } catch (error) {
    console.error("Cosplay command error:", error);
    message.reply("❌ Error fetching cosplay. Try again!");
  }
}

async function onCallback({ bot, callbackQuery, payload }) {
  try {
    const [action, searchTerm] = callbackQuery.data.split(':');
    
    if (action !== 'cosplay_refresh') return;
    
    await bot.answerCallbackQuery(callbackQuery.id, { text: "Fetching another cosplay..." });

    const data = await fetchCosplay(searchTerm);
    
    if (!data.result || data.result.length === 0) {
      await bot.editMessageText("No more matching cosplay found.", {
        chat_id: callbackQuery.message.chat.id,
        message_id: callbackQuery.message.message_id
      });
      return;
    }

    await bot.deleteMessage(callbackQuery.message.chat.id, callbackQuery.message.message_id)
      .catch(console.error);

    await sendCosplayResult(
      bot,
      callbackQuery.message.chat.id,
      data,
      searchTerm,
      callbackQuery.message.reply_to_message?.message_id
    );

  } catch (error) {
    console.error("Cosplay callback error:", error);
    await bot.answerCallbackQuery(callbackQuery.id, { text: "Error fetching cosplay. Try again!" });
  }
}

module.exports = { meta, onStart, onCallback };