import { supabase } from './client';

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
  } catch (err) {
    console.error('[insertDomain] Telegram notification failed:', err);
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

  // Insert into Supabase
  const { error: insertError } = await supabase
    .from('domains')
    .insert({
      name,
      owner,
      paid,
      transaction_hash,
      created_at,
      updated_at,
      expiry,
    });

  if (insertError) {
    console.error('[insertDomain] Insert failed:', insertError);
    return { success: false, error: insertError.message || 'Failed to store domain registration' };
  }

  // Send Telegram notification
  await sendTelegramNotification(owner, name, transaction_hash);

  return { success: true };
} 
