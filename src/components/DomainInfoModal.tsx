
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 p-6 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Domain Details</h3>
            <p className="text-gray-600 mt-1">Registered on Pepe Unchained V2</p>
          </div>
        </div>
        
        {/* Scrollable content */}
        <ScrollArea className="h-full max-h-[60vh]">
          <div className="p-6 space-y-6">
            {/* Domain Name */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/60 rounded-2xl p-6">
                <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text break-all">
                  {domainInfo.name}
                </div>
                <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <Shield className="w-4 h-4" />
                  Active Registration
                </div>
              </div>
            </div>

            {/* Owner Section */}
            <div className="bg-gray-50/80 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Wallet className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-800 text-lg">Owner Information</h4>
              </div>
              
              <div className="bg-white/80 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">Wallet Address</p>
                    <div className="space-y-2">
                      <p className="font-mono text-sm text-gray-800 break-all md:hidden">
                        {formatAddress(domainInfo.owner)}
                      </p>
                      <p className="font-mono text-sm text-gray-800 break-all hidden md:block">
                        {domainInfo.owner}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-3">
                    <button
                      onClick={() => copyToClipboard(domainInfo.owner)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                      title="Copy address"
                    >
                      <Copy className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                    </button>
                    <a
                      href={`https://pepuscan.com/address/${domainInfo.owner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                      title="View on explorer"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Expiry Section */}
            <div className="bg-orange-50/80 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <h4 className="font-semibold text-gray-800 text-lg">Registration Details</h4>
              </div>
              
              <div className="bg-white/80 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">Expires On</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatDate(domainInfo.expiry)}
                </p>
                <p className="text-sm text-gray-500 mt-2">
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
