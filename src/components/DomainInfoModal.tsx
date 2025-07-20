
import React from 'react';
import { X, User, Calendar, Wallet, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DomainInfoModalProps {
  domainInfo: {
    name: string;
    owner: string;
    expiry: string;
  };
  onClose: () => void;
}

export const DomainInfoModal = ({ domainInfo, onClose }: DomainInfoModalProps) => {
  const { toast } = useToast();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50/50 to-blue-50/50 border border-gray-200/60 rounded-3xl p-8 shadow-2xl backdrop-blur-sm max-w-md mx-auto animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Floating decorative elements */}
        <div className="absolute top-4 left-4 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-4 right-4 w-10 h-10 bg-gradient-to-br from-purple-400/30 to-blue-400/30 rounded-full blur-lg animate-bounce"></div>
        
        <div className="relative space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl mb-4 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <User className="w-8 h-8 text-white relative z-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Domain Information</h3>
            <div className="w-24 h-1.5 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto rounded-full shadow-sm"></div>
          </div>
          
          {/* Domain Name */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl blur-md group-hover:blur-lg transition-all duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm border border-yellow-200/60 rounded-2xl p-6 shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text break-all">
                  {domainInfo.name}
                </div>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Wallet className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-700">Owner</span>
            </div>
            
            <div className="flex items-center justify-between bg-gray-50/80 rounded-xl p-4">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Wallet Address</p>
                <p className="font-mono text-sm text-gray-800 break-all md:hidden">
                  {formatAddress(domainInfo.owner)}
                </p>
                <p className="font-mono text-sm text-gray-800 break-all hidden md:block">
                  {domainInfo.owner}
                </p>
              </div>
              <div className="flex gap-2 ml-3">
                <button
                  onClick={() => copyToClipboard(domainInfo.owner)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors group"
                  title="Copy address"
                >
                  <Copy className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                </button>
                <a
                  href={`https://sepolia.etherscan.io/address/${domainInfo.owner}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors group"
                  title="View on explorer"
                >
                  <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                </a>
              </div>
            </div>
          </div>

          {/* Expiry Information */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-gray-700">Expiration</span>
            </div>
            
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-800">
                {formatDate(domainInfo.expiry)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Domain expires on this date
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center space-y-3 pt-2">
            <p className="text-xs text-gray-500 leading-relaxed">
              This domain is registered on the Pepe Unchained V2 blockchain
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
