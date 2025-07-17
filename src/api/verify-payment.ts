
import { supabase } from '@/integrations/supabase/client';

const TREASURY_WALLET = '0xTreasuryPEPU...'; // Replace with actual treasury wallet
const PEPU_RPC_URL = 'https://rpc-pepu-v2-mainnet-0.t.conduit.xyz';
const REQUIRED_AMOUNT = '5000000000000000000'; // 5 USDC in wei
const POLLING_INTERVAL = 15000; // 15 seconds
const MAX_POLLING_TIME = 300000; // 5 minutes

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  status: string;
  blockNumber: number;
}

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

async function getTransactionsByAddress(address: string): Promise<Transaction[]> {
  // This would depend on the specific RPC methods available
  // For now, we'll use a generic approach
  try {
    const transactions = await callPepuRPC('eth_getTransactionsByAddress', [address]);
    return transactions || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

async function verifyTransaction(txHash: string): Promise<Transaction | null> {
  try {
    const tx = await callPepuRPC('eth_getTransactionByHash', [txHash]);
    const receipt = await callPepuRPC('eth_getTransactionReceipt', [txHash]);
    
    if (tx && receipt) {
      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        status: receipt.status === '0x1' ? 'confirmed' : 'failed',
        blockNumber: parseInt(receipt.blockNumber, 16),
      };
    }
  } catch (error) {
    console.error('Error verifying transaction:', error);
  }
  return null;
}

async function sendTelegramNotification(wallet: string, name: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) {
    console.log('Telegram bot not configured');
    return;
  }

  const message = `✅ New domain reserved!
Wallet: ${wallet}
Name: ${name}
Time: ${new Date().toISOString()}`;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
}

export async function POST(request: Request) {
  const { wallet, name } = await request.json();

  if (!wallet || !name) {
    return Response.json({ success: false, error: 'Wallet and name are required' });
  }

  try {
    // Check if domain is still available
    const { data: existingDomain } = await supabase
      .from('domains')
      .select('name')
      .eq('name', name)
      .eq('paid', true)
      .maybeSingle();

    if (existingDomain) {
      return Response.json({ success: false, error: 'Domain is no longer available' });
    }

    // Check if wallet already has a domain
    const { data: existingWallet } = await supabase
      .from('domains')
      .select('name')
      .eq('owner', wallet.toLowerCase())
      .eq('paid', true)
      .maybeSingle();

    if (existingWallet) {
      return Response.json({ success: false, error: 'Wallet has already registered a domain' });
    }

    // Start polling for payment
    const startTime = Date.now();
    let paymentFound = false;

    while (Date.now() - startTime < MAX_POLLING_TIME && !paymentFound) {
      try {
        const transactions = await getTransactionsByAddress(wallet);
        
        for (const tx of transactions) {
          if (
            tx.to?.toLowerCase() === TREASURY_WALLET.toLowerCase() &&
            tx.from?.toLowerCase() === wallet.toLowerCase() &&
            tx.value === REQUIRED_AMOUNT &&
            tx.status === 'confirmed'
          ) {
            // Payment found! Store in database
            const { error: insertError } = await supabase
              .from('domains')
              .insert({
                name,
                owner: wallet.toLowerCase(),
                paid: true,
                transaction_hash: tx.hash,
              });

            if (insertError) {
              console.error('Error storing domain:', insertError);
              return Response.json({ success: false, error: 'Failed to store domain registration' });
            }

            // Send Telegram notification
            await sendTelegramNotification(wallet, name);

            return Response.json({ success: true, name, txHash: tx.hash });
          }
        }
      } catch (error) {
        console.error('Error during polling:', error);
      }

      // Wait before next poll
      if (Date.now() - startTime < MAX_POLLING_TIME) {
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
      }
    }

    return Response.json({ success: false, error: 'Payment not found within time limit' });

  } catch (error) {
    console.error('Payment verification error:', error);
    return Response.json({ success: false, error: 'Internal server error' });
  }
}
