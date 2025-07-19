import { supabase } from '@/integrations/supabase/client';

const TREASURY_WALLET = '0x5359d161d3cdBCfA6C38A387b7F685ebe354368f'; // Fixed - now 42 characters
const PEPU_RPC_URL = 'https://rpc-pepu-v2-mainnet-0.t.conduit.xyz';
const REQUIRED_AMOUNT = '5'; // 5 USDC (6 decimals for USDC)
const USDC_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'; // TODO: Replace this with the actual USDC contract address on Pepe Unchained V2

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
  // Log the notification for now - you can configure actual Telegram bot later
  console.log(`✅ New domain registered!
Wallet: ${wallet}
Domain: ${name}
Transaction: ${txHash}
Time: ${new Date().toISOString()}`);
}

export async function POST(request: Request) {
  const { wallet, name, txHash } = await request.json();

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

    // If transaction hash is provided, verify it directly
    if (txHash) {
      const isValidPayment = await verifyTransaction(txHash, wallet);
      
      if (isValidPayment) {
        // Store in database
        const { error: insertError } = await supabase
          .from('domains')
          .insert({
            name,
            owner: wallet.toLowerCase(),
            paid: true,
            transaction_hash: txHash,
          });

        if (insertError) {
          console.error('Error storing domain:', insertError);
          return Response.json({ success: false, error: 'Failed to store domain registration' });
        }

        // Send Telegram notification
        await sendTelegramNotification(wallet, name, txHash);

        return Response.json({ success: true, name, txHash });
      } else {
        return Response.json({ success: false, error: 'Invalid or insufficient payment transaction' });
      }
    }

    // If no transaction hash provided, fall back to polling (for backward compatibility)
    return Response.json({ success: false, error: 'Transaction hash required for verification' });

  } catch (error) {
    console.error('Payment verification error:', error);
    return Response.json({ success: false, error: 'Internal server error' });
  }
}
