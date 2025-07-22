import { supabase } from '@/integrations/supabase/client';

const TREASURY_WALLET = '0x136baB70d7BE84abE06E1de8873E9C2f8c85F2AB'; // Fixed - now 42 characters
const PEPU_RPC_URL = 'https://eth-sepolia.public.blastapi.io';
const REQUIRED_AMOUNT = '5'; // 5 USDC (6 decimals for USDC)
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
  // Log the notification for now - you can configure actual Telegram bot later
  console.log(`✅ New domain registered!
Wallet: ${wallet}
Domain: ${name}
Transaction: ${txHash}
Time: ${new Date().toISOString()}`);
}

export async function POST(request: Request) {
  const { wallet, name, txHash } = await request.json();

  console.log('[verify-payment] Incoming:', { wallet, name, txHash });

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
      console.log('[verify-payment] Domain already taken:', name);
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
      console.log('[verify-payment] Wallet already owns a domain:', wallet);
      return Response.json({ success: false, error: 'Wallet has already registered a domain' });
    }

    // If transaction hash is provided, verify it directly
    if (txHash) {
      const isValidPayment = await verifyTransaction(txHash, wallet);
      console.log('[verify-payment] Payment verified:', isValidPayment);
      
      if (isValidPayment) {
        // Store in database
        const now = new Date().toISOString();
        const { error: insertError } = await supabase
          .from('domains')
          .insert({
            name,
            owner: wallet.toLowerCase(),
            paid: true,
            transaction_hash: txHash,
            created_at: now,
            updated_at: now,
            expiry: null,
          });

        if (insertError) {
          console.error('[verify-payment] Error storing domain:', insertError);
          return Response.json({ success: false, error: insertError.message || 'Failed to store domain registration' });
        }

        // Send Telegram notification
        await sendTelegramNotification(wallet, name, txHash);

        return Response.json({ success: true, name, txHash });
      } else {
        console.log('[verify-payment] Invalid or insufficient payment transaction:', txHash);
        return Response.json({ success: false, error: 'Invalid or insufficient payment transaction' });
      }
    }

    // If no transaction hash provided, fall back to polling (for backward compatibility)
    return Response.json({ success: false, error: 'Transaction hash required for verification' });

  } catch (error) {
    console.error('[verify-payment] Payment verification error:', error);
    return Response.json({ success: false, error: error?.message || 'Internal server error' });
  }
}
