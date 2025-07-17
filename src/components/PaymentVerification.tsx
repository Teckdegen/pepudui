
import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';

interface PaymentVerificationProps {
  walletAddress: string;
  domainName: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const TREASURY_WALLET = '0x742d35Cc6635C0532925a3b8D17Cc6b9fdc7';
const USDC_CONTRACT = '0xA0b86a33E6441b8435b662C0c5b90FdF0Be3D55b'; // USDC on Pepu chain
const PEPU_USDC_AMOUNT = '5'; // 5 USDC

export const PaymentVerification = ({ 
  walletAddress, 
  domainName, 
  onSuccess, 
  onError 
}: PaymentVerificationProps) => {
  const { isConnected } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [txHash, setTxHash] = useState<string | null>(null);

  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const sendPayment = async () => {
    if (!isConnected) {
      onError('Please connect your wallet');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('Creating transaction...');

    try {
      // Send USDC transfer transaction
      writeContract({
        address: USDC_CONTRACT as `0x${string}`,
        abi: [
          {
            name: 'transfer',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }]
          }
        ],
        functionName: 'transfer',
        args: [
          TREASURY_WALLET as `0x${string}`,
          parseUnits(PEPU_USDC_AMOUNT, 6) // USDC has 6 decimals
        ],
      });
    } catch (error) {
      console.error('Transaction error:', error);
      setPaymentStatus('Transaction failed');
      onError('Failed to create transaction');
      setIsProcessing(false);
    }
  };

  // Handle transaction confirmation
  React.useEffect(() => {
    if (hash) {
      setTxHash(hash);
      setPaymentStatus('Transaction sent! Waiting for confirmation...');
    }
  }, [hash]);

  React.useEffect(() => {
    if (isConfirmed && hash) {
      setPaymentStatus('Payment confirmed! Registering domain...');
      verifyPayment(hash);
    }
  }, [isConfirmed, hash]);

  React.useEffect(() => {
    if (writeError) {
      console.error('Write error:', writeError);
      setPaymentStatus('Transaction failed');
      onError(writeError.message || 'Transaction failed');
      setIsProcessing(false);
    }
  }, [writeError, onError]);

  const verifyPayment = async (transactionHash: string) => {
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: walletAddress,
          name: domainName,
          txHash: transactionHash,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPaymentStatus('Domain registered successfully! 🎉');
        onSuccess();
      } else {
        setPaymentStatus(`Registration failed: ${result.error}`);
        onError(result.error);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentStatus('Registration verification failed');
      onError('Registration verification failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl">
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-800">Complete Registration</h3>
        
        <div className="space-y-4 text-gray-600">
          <p>Register <span className="text-yellow-500 font-medium">{domainName}</span> for:</p>
          <div className="text-2xl font-bold text-yellow-500 text-center">
            ${PEPU_USDC_AMOUNT} USDC
          </div>
          <p className="text-sm">
            Click "Pay & Register" to send payment from your connected wallet and automatically register your domain.
          </p>
        </div>

        <button
          onClick={sendPayment}
          disabled={isPending || isConfirming || isProcessing}
          className="w-full px-6 py-3 bg-yellow-500 text-black rounded-2xl hover:bg-yellow-400 transition-colors font-medium disabled:opacity-50"
        >
          {isPending ? 'Confirm in Wallet...' : 
           isConfirming ? 'Confirming Payment...' : 
           isProcessing ? 'Processing...' : 
           'Pay & Register'}
        </button>

        {paymentStatus && (
          <div className={`text-center p-3 rounded-xl ${
            paymentStatus.includes('successfully') || paymentStatus.includes('confirmed') 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : paymentStatus.includes('failed') || paymentStatus.includes('error')
              ? 'bg-red-100 text-red-700 border border-red-200'
              : 'bg-blue-100 text-blue-700 border border-blue-200'
          }`}>
            {paymentStatus}
          </div>
        )}

        {txHash && (
          <div className="text-xs text-gray-500 text-center">
            <p>Transaction Hash:</p>
            <p className="font-mono break-all">{txHash}</p>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center">
          Payment will be processed automatically after wallet confirmation.
        </p>
      </div>
    </div>
  );
};
