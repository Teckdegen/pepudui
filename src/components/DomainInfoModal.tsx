
import React from 'react';
import { X, User, Calendar, Wallet, Copy, ExternalLink, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

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
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-sm p-4 sm:p-6 border-b border-gray-100/80">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-white/80 rounded-full transition-all duration-200 hover:scale-105"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
          
          <div className="text-center pr-10">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 shadow-lg">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Domain Details</h3>
            <p className="text-sm text-gray-600">Registered on Pepe Unchained V2</p>
          </div>
        </div>
        
        {/* Scrollable content */}
        <ScrollArea className="h-full max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-140px)]">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Domain Name */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-yellow-50/80 to-orange-50/80 border border-yellow-200/60 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text break-all leading-tight">
                  {domainInfo.name}
                </div>
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-green-100/80 text-green-700 rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                  Active Registration
                </div>
              </div>
            </div>

            {/* Owner Section */}
            <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100/80 rounded-lg backdrop-blur-sm">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-800 text-base sm:text-lg">Owner Information</h4>
              </div>
              
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/60">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">Wallet Address</p>
                    <div className="space-y-1">
                      <p className="font-mono text-xs sm:text-sm text-gray-800 break-all sm:hidden">
                        {formatAddress(domainInfo.owner)}
                      </p>
                      <p className="font-mono text-xs sm:text-sm text-gray-800 break-all hidden sm:block">
                        {domainInfo.owner}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:ml-3 justify-end sm:justify-start">
                    <button
                      onClick={() => copyToClipboard(domainInfo.owner)}
                      className="p-2 hover:bg-gray-100/80 rounded-lg transition-all duration-200 group hover:scale-105"
                      title="Copy address"
                    >
                      <Copy className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                    </button>
                    <a
                      href={`https://pepuscan.com/address/${domainInfo.owner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-100/80 rounded-lg transition-all duration-200 group hover:scale-105"
                      title="View on explorer"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Expiry Section */}
            <div className="bg-orange-50/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="p-2 bg-orange-100/80 rounded-lg backdrop-blur-sm">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                </div>
                <h4 className="font-semibold text-gray-800 text-base sm:text-lg">Registration Details</h4>
              </div>
              
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-white/60">
                <p className="text-xs sm:text-sm text-gray-600 mb-2">Expires On</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 break-words">
                  {formatDate(domainInfo.expiry)}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                  Registration valid until this date
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
