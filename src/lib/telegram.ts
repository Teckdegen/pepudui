// Shared Telegram notification utility
const chatId = '6213503516'; // <-- Put your chat ID here
const botToken = '8186054883:AAGRyN-t-VHRUZcN7I-ZmsVUnMxj5EQ_9EA'; // <-- Put your bot token here

export async function sendTelegramNotification(wallet: string, name: string, txHash: string): Promise<boolean> {
  if (!chatId || !botToken) {
    console.error('[telegram] Missing Telegram bot token or chat ID in code');
    return false;
  }
  const message = `✅ New domain registered!\nDomain: ${name}\nOwner: ${wallet}\nTransaction: ${txHash}\nTime: ${new Date().toISOString()}`;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error('[telegram] Telegram API error:', res.status, errorText);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[telegram] Telegram notification failed:', err);
    return false;
  }
} 
