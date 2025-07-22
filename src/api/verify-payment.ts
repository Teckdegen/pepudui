import { supabase } from '@/integrations/supabase/client';

const TREASURY_WALLET = '0x3a5149Ae34B99087fF51EC374EeC371623789Cd0'; // Fixed - now 42 characters
const PEPU_RPC_URL = 'https://eth-sepolia.public.blastapi.io';
const REQUIRED_AMOUNT = '1'; // 5 USDC (6 decimals for USDC)
const USDC_CONTRACT_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'; // TODO: Replace this with the actual USDC contract address on Pepe Unchained V2

async function callPepuRPC(method: string, params: any[] = []) {
  const response = await fetch(PEPU_RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: 1,
    }),
  });

  const data = await response.json();
  return data.result;
}

async function verifyTransaction(txHash: string, fromAddress: string): Promise<boolean> {
  try {
    // Get transaction details
    const tx = await callPepuRPC('eth_getTransactionByHash', [txHash]);
    const receipt = await callPepuRPC('eth_getTransactionReceipt', [txHash]);

    if (!tx || !receipt) {
      return false;
    }

    // Verify transaction is confirmed
    if (receipt.status !== '0x1') {
      return false;
    }

    // Verify sender
    if (tx.from?.toLowerCase() !== fromAddress.toLowerCase()) {
      return false;
    }

    // Check for USDC transfer events
    const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    const treasuryTopic = `0x000000000000000000000000${TREASURY_WALLET.slice(2).toLowerCase()}`;

    for (const log of receipt.logs || []) {
      if (
        log.topics?.[0] === transferEventSignature &&
        log.topics?.[2] === treasuryTopic &&
        log.address?.toLowerCase() === USDC_CONTRACT_ADDRESS.toLowerCase()
      ) {
        // Parse amount from log data
        const amount = parseInt(log.data, 16).toString();
        if (parseInt(amount) >= parseInt(REQUIRED_AMOUNT)) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return false;
  }
}

async function sendTelegramNotification(wallet: string, name: string, txHash: string) {
  const chatId = '6213503516';
  const botToken = '8186054883:AAGRyN-t-VHRUZcN7I-ZmsVUnMxj5EQ_9EA';
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
    console.error('[verify-payment] Telegram notification failed:', err);
  }
}

export async function POST(request: Request) {
  const { wallet, name, txHash } = await request.json();

  console.log('[verify-payment] Incoming:', { wallet, name, txHash });

  if (!wallet || !name) {
    return Response.json({ success: false, error: 'Wallet and name are required' });
  }

  // Blockchain verification
  const isValid = await verifyTransaction(txHash, wallet);
  if (!isValid) {
    return Response.json({ success: false, error: 'Blockchain payment verification failed' });
  }

  // Prepare timestamps
  const now = new Date();
  const expiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  // Insert into Supabase with all required fields
  const { error: insertError } = await supabase
    .from('domains')
    .insert({
      name,
      owner: wallet.toLowerCase(),
      paid: true,
      transaction_hash: txHash,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      expiry: expiry.toISOString(),
    });

  if (insertError) {
    console.error('[verify-payment] Insert failed:', insertError);
    return Response.json({ success: false, error: insertError.message || 'Failed to store domain registration' });
  }

  // Send Telegram notification
  await sendTelegramNotification(wallet, name, txHash);

  return Response.json({ success: true, name, txHash });
}
