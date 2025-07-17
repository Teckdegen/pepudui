
import { useState } from 'react';

interface PaymentVerificationProps {
  walletAddress: string;
  domainName: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const TREASURY_WALLET = '0xTreasuryPEPU...'; // Replace with actual treasury wallet
const PEPU_USDC_AMOUNT = '5'; // 5 USDC

export const PaymentVerification = ({ 
  walletAddress, 
  domainName, 
  onSuccess, 
  onError 
}: PaymentVerificationProps) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('');

  const verifyPayment = async () => {
    setIsVerifying(true);
    setPaymentStatus('Waiting for payment...');

    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: walletAddress,
          name: domainName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPaymentStatus('Payment confirmed! Domain registered.');
        onSuccess();
      } else {
        setPaymentStatus(`Payment verification failed: ${result.error}`);
        onError(result.error);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentStatus('Payment verification failed');
      onError('Payment verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-3xl p-8">
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white">Complete Your Payment</h3>
        
        <div className="space-y-4 text-white/80">
          <p>To register <span className="text-yellow-300 font-medium">{domainName}</span>:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Send exactly <span className="text-yellow-300 font-medium">${PEPU_USDC_AMOUNT} USDC</span> to:</li>
            <li className="text-sm font-mono bg-white/10 p-2 rounded break-all">
              {TREASURY_WALLET}
            </li>
            <li>Click "Verify Payment" below</li>
          </ol>
        </div>

        <button
          onClick={verifyPayment}
          disabled={isVerifying}
          className="w-full px-6 py-3 bg-yellow-500 text-black rounded-2xl hover:bg-yellow-400 transition-colors font-medium disabled:opacity-50"
        >
          {isVerifying ? 'Verifying Payment...' : 'Verify Payment'}
        </button>

        {paymentStatus && (
          <div className={`text-center p-3 rounded-xl ${
            paymentStatus.includes('confirmed') 
              ? 'bg-green-500/20 text-green-300' 
              : paymentStatus.includes('failed')
              ? 'bg-red-500/20 text-red-300'
              : 'bg-blue-500/20 text-blue-300'
          }`}>
            {paymentStatus}
          </div>
        )}

        <p className="text-xs text-white/60 text-center">
          Payment verification can take up to 5 minutes. Please be patient.
        </p>
      </div>
    </div>
  );
};
