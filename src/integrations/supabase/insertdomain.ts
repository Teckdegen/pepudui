const chatId = '6213503516';
const botToken = '8186054883:AAGRyN-t-VHRUZcN7I-ZmsVUnMxj5EQ_9EA';

async function sendTelegramNotification(wallet: string, name: string, txHash: string) {
  const message = `✅ New domain registered!\nDomain: ${name}\nOwner: ${wallet}\nTransaction: ${txHash}\nTime: ${new Date().toISOString()}`;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    return { success: true };
  } catch (err) {
    console.error('[insertDomain] Telegram notification failed:', err);
    return { success: false, error: 'Failed to send Telegram notification' };
  }
}

export async function insertDomain({ name, owner, paid, transaction_hash, created_at, updated_at, expiry, paymentVerified }: {
  name: string;
  owner: string;
  paid: boolean;
  transaction_hash: string;
  created_at: string;
  updated_at: string;
  expiry: string;
  paymentVerified: boolean;
}) {
  if (!paymentVerified) {
    return { success: false, error: 'Payment not verified' };
  }
  // Only send Telegram notification, do not insert into Supabase
  return await sendTelegramNotification(owner, name, transaction_hash);
} 
