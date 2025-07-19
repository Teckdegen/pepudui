
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
        chain,
        account: address,
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
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-yellow-50/30 to-orange-50/40 border border-yellow-200/50 rounded-3xl p-8 shadow-2xl backdrop-blur-sm max-w-md mx-auto">
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-4 left-4 w-8 h-8 bg-gradient-to-br from-orange-400/30 to-yellow-400/30 rounded-full blur-lg"></div>
      
      <div className="relative space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl">🌟</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Complete Registration</h3>
          <div className="w-20 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full"></div>
        </div>
        
        <div className="space-y-4 text-center">
          <p className="text-lg text-gray-600">Secure your premium domain</p>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl blur-sm"></div>
            <div className="relative bg-white/80 backdrop-blur-sm border border-yellow-200/50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text break-all">
                {domainName}
              </div>
            </div>
          </div>
          
          <div className="inline-flex items-center justify-center bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-2xl shadow-lg">
            <span className="text-xl font-bold">${PEPU_USDC_AMOUNT} USDC</span>
          </div>
          
          <p className="text-sm text-gray-600 px-4 leading-relaxed">
            {isWrongChain 
              ? '⚠️ Please switch to Pepe Unchained V2 network to continue'
              : '✨ Click below to open your wallet and confirm the secure payment'
            }
          </p>
        </div>

        {isWrongChain && (
          <div className="bg-gradient-to-r from-orange-100 to-red-100 border border-orange-300 text-orange-800 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-2xl mr-2">⚠️</span>
              <p className="font-semibold">Wrong Network Detected</p>
            </div>
            <p className="text-sm">Please switch to Pepe Unchained V2 to continue with your registration</p>
          </div>
        )}

        <button
          onClick={sendPayment}
          disabled={isPending || isConfirming || isProcessing || !isConnected}
          className="group relative w-full overflow-hidden bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white rounded-2xl py-4 px-6 font-bold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-center space-x-2">
            <span className="text-2xl">
              {!isConnected ? '🔗' :
               isWrongChain ? '🔄' :
               isPending ? '⏳' : 
               isConfirming ? '⌛' : 
               isProcessing ? '🔄' : 
               '💎'}
            </span>
            <span>
              {!isConnected ? 'Connect Wallet First' :
               isWrongChain ? 'Switch Network & Pay' :
               isPending ? 'Confirm in Wallet...' : 
               isConfirming ? 'Confirming Payment...' : 
               isProcessing ? 'Processing Registration...' : 
               'Pay & Register Domain'}
            </span>
          </div>
        </button>

        {paymentStatus && (
          <div className={`relative overflow-hidden text-center p-4 rounded-2xl transition-all duration-500 ${
            paymentStatus.includes('successfully') || paymentStatus.includes('confirmed') 
              ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300' 
              : paymentStatus.includes('failed') || paymentStatus.includes('error')
              ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-300'
              : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-300'
          }`}>
            <div className="relative">
              <div className="font-semibold text-base mb-1">
                {paymentStatus.includes('successfully') ? '🎉 ' : 
                 paymentStatus.includes('failed') ? '❌ ' : 
                 paymentStatus.includes('Switching') ? '🔄 ' :
                 paymentStatus.includes('Waiting') ? '⏳ ' : '💫 '}
                {paymentStatus}
              </div>
            </div>
          </div>
        )}

        {txHash && (
          <div className="bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 text-center">
            <p className="font-semibold text-gray-700 mb-2 flex items-center justify-center">
              <span className="mr-2">🔗</span>
              Transaction Hash
            </p>
            <p className="font-mono text-xs text-gray-600 break-all bg-white/60 p-2 rounded-lg">{txHash}</p>
          </div>
        )}

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <span className="text-lg">🔒</span>
            <p className="text-sm font-medium">Secure blockchain payment</p>
          </div>
          <p className="text-xs text-gray-500">
            Your wallet will handle the transaction securely
          </p>
        </div>
      </div>
    </div>
  );
};
