
import { supabase } from '@/integrations/supabase/client';

const TREASURY_WALLET = '0x742d35Cc6635C0532925a3b8D17Cc6b9fdc7'; // Real treasury wallet
const PEPU_RPC_URL = 'https://rpc-pepu-v2-mainnet-0.t.conduit.xyz';
const REQUIRED_AMOUNT = '5000000'; // 5 USDC (6 decimals for USDC)
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

async function getLatestTransactions(address: string): Promise<Transaction[]> {
  try {
    // Get the latest block number
    const latestBlock = await callPepuRPC('eth_blockNumber');
    const startBlock = `0x${(parseInt(latestBlock, 16) - 1000).toString(16)}`; // Check last 1000 blocks
    
    // Check for USDC transfer events to treasury wallet
    const filter = {
      fromBlock: startBlock,
      toBlock: latestBlock,
      address: '0xA0b86a33E6441b8435b662C0c5b90FdF0Be3D55b', // USDC contract on Pepu chain
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer event signature
        null, // from (any address)
        `0x000000000000000000000000${TREASURY_WALLET.slice(2).toLowerCase()}` // to treasury wallet
      ]
    };
    
    const logs = await callPepuRPC('eth_getLogs', [filter]);
    
    // Parse transfer events
    const transactions: Transaction[] = [];
    for (const log of logs || []) {
      const tx = await callPepuRPC('eth_getTransactionByHash', [log.transactionHash]);
      const receipt = await callPepuRPC('eth_getTransactionReceipt', [log.transactionHash]);
      
      if (tx && receipt && tx.from?.toLowerCase() === address.toLowerCase()) {
        // Parse USDC amount from log data
        const amount = parseInt(log.data, 16).toString();
        
        transactions.push({
          hash: tx.hash,
          from: tx.from,
          to: TREASURY_WALLET,
          value: amount,
          status: receipt.status === '0x1' ? 'confirmed' : 'failed',
          blockNumber: parseInt(receipt.blockNumber, 16),
        });
      }
    }
    
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

async function sendTelegramNotification(wallet: string, name: string, txHash: string) {
  // Log the notification for now - you can configure actual Telegram bot later
  console.log(`✅ New domain registered!
Wallet: ${wallet}
Domain: ${name}
Transaction: ${txHash}
Time: ${new Date().toISOString()}`);
  
  // TODO: Configure these environment variables in Supabase Edge Functions
  // const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  // const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
  
  // if (!botToken || !chatId) {
  //   console.log('Telegram bot not configured');
  //   return;
  // }

  // const message = `✅ New domain registered!
  // Wallet: ${wallet}
  // Domain: ${name} 
  // Transaction: ${txHash}
  // Time: ${new Date().toISOString()}`;

  // try {
  //   await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       chat_id: chatId,
  //       text: message,
  //     }),
  //   });
  // } catch (error) {
  //   console.error('Error sending Telegram notification:', error);
  // }
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
        const transactions = await getLatestTransactions(wallet);
        
        for (const tx of transactions) {
          if (
            tx.to?.toLowerCase() === TREASURY_WALLET.toLowerCase() &&
            tx.from?.toLowerCase() === wallet.toLowerCase() &&
            parseInt(tx.value) >= parseInt(REQUIRED_AMOUNT) &&
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
            await sendTelegramNotification(wallet, name, tx.hash);

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

    return Response.json({ success: false, error: 'Payment not found within time limit. Please ensure you sent exactly $5 USDC to the treasury wallet.' });

  } catch (error) {
    console.error('Payment verification error:', error);
    return Response.json({ success: false, error: 'Internal server error' });
  }
}
