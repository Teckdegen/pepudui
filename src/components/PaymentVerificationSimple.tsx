import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, Wallet, Shield, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PaymentVerificationProps {
  walletAddress: string;
  domainName: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PEPU_USDC_AMOUNT = '5';

export const PaymentVerificationSimple = ({ 
  walletAddress, 
  domainName, 
  onSuccess, 
  onError 
}: PaymentVerificationProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const sendPayment = async () => {
    setIsProcessing(true);
    setPaymentStatus('Processing payment...');
    
    // Simulate payment processing
    setTimeout(() => {
      setPaymentStatus('Payment confirmed! Registering domain...');
      setTimeout(() => {
        setPaymentStatus('Domain registered successfully! 🎉');
        setIsProcessing(false);
        onSuccess();
      }, 2000);
    }, 3000);
  };

  return (
    <div 
      className="relative w-full max-w-md max-h-[90vh] overflow-hidden bg-white rounded-3xl shadow-2xl"
      onClick={handleModalClick}
    >
      {/* Header - Fixed */}
      <div className="relative bg-gradient-to-br from-yellow-50 to-orange-50 p-6 border-b border-yellow-200/60">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl mb-4 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
            <Sparkles className="w-8 h-8 text-white relative z-10" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Complete Registration</h3>
          <div className="w-24 h-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full shadow-sm"></div>
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="h-full max-h-[60vh]">
        <div className="p-6 space-y-6">
          {/* Domain display */}
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

          {/* Status display */}
          {paymentStatus && (
            <div className={`relative overflow-hidden text-center p-5 rounded-2xl transition-all duration-500 animate-fade-in ${
              paymentStatus.includes('successfully') || paymentStatus.includes('confirmed') 
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300' 
                : paymentStatus.includes('failed') || paymentStatus.includes('error')
                ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-300'
                : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-300'
            }`}>
              <div className="flex items-center justify-center mb-2">
                {paymentStatus.includes('successfully') || paymentStatus.includes('confirmed') ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : paymentStatus.includes('failed') || paymentStatus.includes('error') ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                )}
                <span className="ml-2 font-semibold text-base">{paymentStatus}</span>
              </div>
            </div>
          )}

          {/* Security footer */}
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

      {/* Fixed Footer with Action Button */}
      <div className="border-t border-gray-200 p-6 bg-white">
        <button
          onClick={sendPayment}
          disabled={isProcessing}
          className="group relative w-full overflow-hidden bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white rounded-2xl py-5 px-6 font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none disabled:hover:shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-center space-x-3">
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            <span>{isProcessing ? 'Processing...' : 'Pay & Register Domain'}</span>
          </div>
        </button>
      </div>
    </div>
  );
};