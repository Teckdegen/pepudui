import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { parseUnits, Address } from 'viem';
import { AlertCircle, CheckCircle, Loader2, Wallet, Shield, Sparkles } from 'lucide-react';
import { pepeUnchainedV2 } from '../lib/wallet-config';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PaymentVerificationProps {
  walletAddress: string;
  domainName: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const TREASURY_WALLET: Address = '0x136baB70d7BE84abE06E1de8873E9C2f8c85F2AB';
const USDC_CONTRACT: Address = '0x0000000000000000000000000000000000000000'; // Placeholder address
const PEPU_USDC_AMOUNT = '0001';
const TARGET_CHAIN_ID = 11155111;

const USDC_ABI = [
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
] as const;

export const PaymentVerification = ({ 
  walletAddress, 
  domainName, 
  onSuccess, 
  onError 
}: PaymentVerificationProps) => {
  const { isConnected, address, chainId } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [txHash, setTxHash] = useState<string | null>(null);

  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  
  const { 
    writeContract, 
    data: hash, 
    error: writeError, 
    isPending 
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const sendPayment = async () => {
    console.log('sendPayment called', { isConnected, address, chainId });
    if (!isConnected || !address) {
      onError('Please connect your wallet');
      return;
    }

    setIsProcessing(true);

    if (chainId !== TARGET_CHAIN_ID) {
      try {
        setPaymentStatus('Switching to Pepe Unchained V2 network...');
        console.log('Attempting to switch chain to', TARGET_CHAIN_ID);
        const result = await switchChain({ chainId: TARGET_CHAIN_ID });
        console.log('Switch chain result:', result);
        setTimeout(() => {
          executeTransaction();
        }, 1000);
        return;
      } catch (error) {
        console.error('Chain switch error:', error);
        setPaymentStatus('Please switch to Pepe Unchained V2 network manually');
        onError('Please manually switch to Pepe Unchained V2 network');
        setIsProcessing(false);
        return;
      }
    }

    executeTransaction();
  };

  const executeTransaction = () => {
    setPaymentStatus('Preparing transaction...');

    if (!address) {
      onError('Wallet address not found');
      setIsProcessing(false);
      return;
    }

    try {
      writeContract({
        address: USDC_CONTRACT,
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [
          TREASURY_WALLET,
          parseUnits(PEPU_USDC_AMOUNT, 6) // USDC has 6 decimals
        ],
        chain: pepeUnchainedV2,
        account: address,
      });
    } catch (error) {
      console.error('Transaction error:', error);
      setPaymentStatus('Transaction failed');
      onError('Failed to create transaction');
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (hash) {
      setTxHash(hash);
      setPaymentStatus('Transaction sent! Waiting for confirmation...');
    }
  }, [hash]);

  useEffect(() => {
    if (isConfirmed && hash) {
      setPaymentStatus('Payment confirmed! Registering domain...');
      verifyPayment(hash);
    }
  }, [isConfirmed, hash]);

  useEffect(() => {
    if (writeError) {
      setPaymentStatus('Transaction failed');
      const errorMessage = writeError.message || 'Transaction failed';
      if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
        onError('Transaction was cancelled by user');
      } else if (errorMessage.includes('insufficient funds')) {
        onError('Insufficient USDC balance');
      } else {
        onError(errorMessage);
      }
      setIsProcessing(false);
    }
  }, [writeError, onError]);

  const verifyPayment = async (transactionHash: string) => {
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddress, name: domainName, txHash: transactionHash }),
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
      setPaymentStatus('Registration verification failed');
      onError('Registration verification failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const isWrongChain = chainId !== TARGET_CHAIN_ID;
  const isButtonDisabled = isPending || isConfirming || isProcessing || !isConnected || isSwitchingChain;

  const getButtonIcon = () => {
    if (!isConnected) return <Wallet className="w-5 h-5" />;
    if (isSwitchingChain) return <Loader2 className="w-5 h-5 animate-spin" />;
    if (isWrongChain) return <AlertCircle className="w-5 h-5" />;
    if (isPending) return <Loader2 className="w-5 h-5 animate-spin" />;
    if (isConfirming) return <Loader2 className="w-5 h-5 animate-spin" />;
    if (isProcessing) return <Loader2 className="w-5 h-5 animate-spin" />;
    return <Sparkles className="w-5 h-5" />;
  };

  const getButtonText = () => {
    if (!isConnected) return 'Connect Wallet First';
    if (isSwitchingChain) return 'Switching Network...';
    if (isWrongChain) return 'Switch Network & Pay';
    if (isPending) return 'Confirm in Wallet...';
    if (isConfirming) return 'Confirming Payment...';
    if (isProcessing) return 'Processing Registration...';
    return 'Pay & Register Domain';
  };

  const getStatusIcon = () => {
    if (paymentStatus.includes('successfully') || paymentStatus.includes('confirmed')) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (paymentStatus.includes('failed') || paymentStatus.includes('error')) {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
    return <Loader2 className="w-5 h-5 animate-spin text-blue-600" />;
  };

  return (
    <div 
      className="relative w-full max-w-md max-h-[90vh] overflow-hidden bg-white rounded-3xl shadow-2xl flex flex-col"
      onClick={handleModalClick}
    >
      <div className="relative bg-gradient-to-br from-yellow-50 to-orange-50 p-6 border-b border-yellow-200/60 flex-shrink-0">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl mb-4 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
            <Sparkles className="w-8 h-8 text-white relative z-10" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Complete Registration</h3>
          <div className="w-24 h-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full shadow-sm"></div>
        </div>
      </div>

      <ScrollArea className="flex-grow">
        <div className="p-6 space-y-6">
          <div className="space-y-4 text-center">
            <p className="text-lg text-gray-600 font-medium">Secure your premium domain</p>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl blur-md group-hover:blur-lg transition-all duration-300"></div>
              <div className="relative bg-white/90 backdrop-blur-sm border border-yellow-200/60 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text break-all">
                  {domainName}
                </div>
              </div>
            </div>
            <div className="inline-flex items-center justify-center bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-4 rounded-2xl shadow-xl">
              <Shield className="w-5 h-5 mr-2" />
              <span className="text-xl font-bold">${PEPU_USDC_AMOUNT} USDC</span>
            </div>
          </div>

          {isWrongChain && (
            <div className="bg-gradient-to-r from-orange-100 to-red-100 border border-orange-300 text-orange-800 rounded-2xl p-5 text-center animate-fade-in">
              <div className="flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6 mr-2" />
                <p className="font-semibold">Wrong Network Detected</p>
              </div>
              <p className="text-sm mb-1">Current: {chainId}</p>
              <p className="text-sm font-medium">Required: Pepe Unchained V2</p>
            </div>
          )}

          {paymentStatus && (
            <div className={`relative overflow-hidden text-center p-5 rounded-2xl transition-all duration-500 animate-fade-in ${
              paymentStatus.includes('successfully') || paymentStatus.includes('confirmed') 
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300' 
                : paymentStatus.includes('failed') || paymentStatus.includes('error')
                ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-300'
                : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-300'
            }`}>
              <div className="flex items-center justify-center mb-2">
                {getStatusIcon()}
                <span className="ml-2 font-semibold text-base">{paymentStatus}</span>
              </div>
            </div>
          )}

          {txHash && (
            <div className="bg-gray-50/90 backdrop-blur-sm border border-gray-200 rounded-2xl p-5 text-center animate-fade-in">
              <div className="flex items-center justify-center mb-3">
                <Shield className="w-5 h-5 mr-2 text-gray-600" />
                <p className="font-semibold text-gray-700">Transaction Hash</p>
              </div>
              <p className="font-mono text-xs text-gray-600 break-all bg-white/80 p-3 rounded-lg border">
                {txHash}
              </p>
            </div>
          )}

          <div className="text-center space-y-3 pt-2">
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <Shield className="w-5 h-5" />
              <p className="text-sm font-medium">Secure blockchain payment</p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your wallet will handle the transaction securely on the Pepe Unchained V2 network
            </p>
          </div>
        </div>
      </ScrollArea>

      <div className="border-t border-gray-200 p-6 bg-white flex-shrink-0">
        <button
          onClick={sendPayment}
          disabled={isButtonDisabled}
          className="group relative w-full overflow-hidden bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white rounded-2xl py-5 px-6 font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none disabled:hover:shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-center space-x-3">
            {getButtonIcon()}
            <span>{getButtonText()}</span>
          </div>
        </button>
      </div>
    </div>
  );
};
