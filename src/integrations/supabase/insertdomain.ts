// Removed sendTelegramNotification and bot token/chatId logic. Use shared utility instead.

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
  // Insert domain logic here (if needed)
  return { success: true };
} 
