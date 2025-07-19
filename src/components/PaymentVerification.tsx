
import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { parseUnits } from 'viem';

interface PaymentVerificationProps {
  walletAddress: string;
  domainName: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const TREASURY_WALLET = '0x5359d161d3cdBCfA6C38A387b7F685ebe354368f'; // Your correct treasury address
const USDC_CONTRACT = '0xA0b86a33E6441b8435b662C0c5b90FdF0Be3D55b'; // USDC on Pepu chain
const PEPU_USDC_AMOUNT = '5'; // 5 USDC
const TARGET_CHAIN_ID = 97741; // Pepe Unchained V2 mainnet

export const PaymentVerification = ({ 
  walletAddress, 
  domainName, 
  onSuccess, 
  onError 
}: PaymentVerificationProps) => {
  const { isConnected, address, chain } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [txHash, setTxHash] = useState<string | null>(null);

  const { switchChain } = useSwitchChain();
  
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const sendPayment = async () => {
    if (!isConnected || !address) {
      onError('Please connect your wallet');
      return;
    }

    // Check if we're on the correct chain
    if (chain?.id !== TARGET_CHAIN_ID) {
      try {
        setPaymentStatus('Switching to Pepe Unchained V2...');
        await switchChain({ chainId: TARGET_CHAIN_ID });
      } catch (error) {
        console.error('Chain switch error:', error);
        onError('Please switch to Pepe Unchained V2 network');
        return;
      }
    }

    setIsProcessing(true);
    setPaymentStatus('Opening wallet for confirmation...');

    try {
      console.log('Sending payment to treasury:', TREASURY_WALLET);
      console.log('Amount:', PEPU_USDC_AMOUNT, 'USDC');
      
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
        ] as const,
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
  useEffect(() => {
    if (hash) {
      setTxHash(hash);
      setPaymentStatus('Transaction sent! Waiting for confirmation...');
      console.log('Transaction hash:', hash);
    }
  }, [hash]);

  useEffect(() => {
    if (isConfirmed && hash) {
      setPaymentStatus('Payment confirmed! Registering domain...');
      console.log('Payment confirmed, verifying...');
      verifyPayment(hash);
    }
  }, [isConfirmed, hash]);

  useEffect(() => {
    if (writeError) {
      console.error('Write error:', writeError);
      setPaymentStatus('Transaction failed');
      onError(writeError.message || 'Transaction failed');
      setIsProcessing(false);
    }
  }, [writeError, onError]);

  const verifyPayment = async (transactionHash: string) => {
    try {
      console.log('Verifying payment with hash:', transactionHash);
      console.log('Wallet:', walletAddress);
      console.log('Domain:', domainName);
      
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
      console.log('Verification result:', result);

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

  const isWrongChain = chain?.id !== TARGET_CHAIN_ID;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-2xl backdrop-blur-sm max-w-md mx-auto">
      <div className="space-y-4 md:space-y-6">
        <div className="text-center">
          <h3 className="text-lg md:text-2xl font-bold text-gray-800 mb-2">Complete Registration</h3>
          <div className="w-12 md:w-16 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto rounded-full"></div>
        </div>
        
        <div className="space-y-3 md:space-y-4 text-gray-600 text-center">
          <p className="text-base md:text-lg">Register your domain</p>
          <div className="text-xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text break-all">
            {domainName}
          </div>
          <div className="text-xl md:text-2xl font-bold text-yellow-500">
            ${PEPU_USDC_AMOUNT} USDC
          </div>
          <p className="text-xs md:text-sm text-gray-500 px-2">
            {isWrongChain 
              ? 'Please switch to Pepe Unchained V2 network'
              : 'Click "Pay & Register" to open your wallet and confirm the payment'
            }
          </p>
        </div>

        {isWrongChain && (
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 text-orange-700 border border-orange-200 rounded-xl p-3 text-center">
            <p className="text-sm font-medium">Wrong Network</p>
            <p className="text-xs">Switch to Pepe Unchained V2 to continue</p>
          </div>
        )}

        <button
          onClick={sendPayment}
          disabled={isPending || isConfirming || isProcessing || !isConnected}
          className="w-full px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-xl md:rounded-2xl hover:from-yellow-400 hover:to-yellow-500 transition-all duration-300 font-bold text-base md:text-lg shadow-lg hover:shadow-xl transform active:scale-95 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg"
        >
          {!isConnected ? 'Connect Wallet First' :
           isWrongChain ? 'Switch Network & Pay' :
           isPending ? 'Confirm in Wallet...' : 
           isConfirming ? 'Confirming Payment...' : 
           isProcessing ? 'Processing...' : 
           '💰 Pay & Register'}
        </button>

        {paymentStatus && (
          <div className={`text-center p-3 md:p-4 rounded-xl transition-all duration-300 ${
            paymentStatus.includes('successfully') || paymentStatus.includes('confirmed') 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200' 
              : paymentStatus.includes('failed') || paymentStatus.includes('error')
              ? 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200'
              : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200'
          }`}>
            <div className="font-medium text-sm md:text-base">{paymentStatus}</div>
          </div>
        )}

        {txHash && (
          <div className="text-xs text-gray-500 text-center bg-gray-50 p-2 md:p-3 rounded-xl">
            <p className="font-medium mb-1">Transaction Hash:</p>
            <p className="font-mono break-all text-gray-600 text-xs">{txHash}</p>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-500">
            🔒 Secure payment via your connected wallet
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Your wallet will open automatically for confirmation
          </p>
        </div>
      </div>
    </div>
  );
};
