
import { useState } from 'react';

interface PaymentVerificationProps {
  walletAddress: string;
  domainName: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const TREASURY_WALLET = '0x742d35Cc6635C0532925a3b8D17Cc6b9fdc7';
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
    setPaymentStatus('Checking for payment...');

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
        setPaymentStatus(`Verification failed: ${result.error}`);
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
    <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl">
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-800">Complete Your Payment</h3>
        
        <div className="space-y-4 text-gray-600">
          <p>To register <span className="text-yellow-500 font-medium">{domainName}</span>:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Send exactly <span className="text-yellow-500 font-medium">${PEPU_USDC_AMOUNT} USDC</span> to:</li>
            <li className="text-sm font-mono bg-gray-100 p-3 rounded break-all border">
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
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : paymentStatus.includes('failed')
              ? 'bg-red-100 text-red-700 border border-red-200'
              : 'bg-blue-100 text-blue-700 border border-blue-200'
          }`}>
            {paymentStatus}
          </div>
        )}

        <p className="text-xs text-gray-500 text-center">
          Payment verification can take up to 5 minutes. Please be patient.
        </p>
      </div>
    </div>
  );
};
