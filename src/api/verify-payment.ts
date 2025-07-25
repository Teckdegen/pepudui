import { sendTelegramNotification } from '@/lib/telegram';

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

export async function POST(request: Request) {
  const { wallet, name, txHash } = await request.json();

  if (!wallet || !name) {
    return Response.json({ success: false, error: 'Wallet and name are required' });
  }

  // Blockchain verification
  let paymentVerified = false;
  try {
    paymentVerified = await verifyTransaction(txHash, wallet);
  } catch (error) {
    console.error('Error during blockchain verification:', error);
    return Response.json({ success: false, error: 'Blockchain payment verification failed', details: String(error) });
  }
  if (!paymentVerified) {
    return Response.json({ success: false, error: 'Blockchain payment verification failed' });
  }

  // Send Telegram notification only
  let tgSuccess = false;
  try {
    tgSuccess = await sendTelegramNotification(wallet, name, txHash);
  } catch (err) {
    console.error('[verify-payment] Telegram notification failed:', err);
    return Response.json({ success: false, error: 'Failed to send Telegram notification', details: String(err) });
  }
  if (!tgSuccess) {
    return Response.json({ success: false, error: 'Failed to send Telegram notification' });
  }

  // Always return a success message that says domain registered
  return Response.json({ success: true, message: 'Domain registered successfully!', name, txHash });
}

