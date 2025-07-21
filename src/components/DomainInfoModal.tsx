
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

  // Prevent background scroll when modal is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
        {/* Fixed Header */}
        <div className="relative bg-gradient-to-br from-slate-50 to-gray-100 p-6 border-b border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-200 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="text-center pr-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Domain Information</h3>
            <p className="text-sm text-gray-600 font-medium">Registered on Pepe Unchained V2</p>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="h-96 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {/* Domain Name */}
              <div className="text-center">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
                  <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text break-all mb-3">
                    {domainInfo.name}
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold">
                    <Shield className="w-4 h-4" />
                    Active Registration
                  </div>
                </div>
              </div>

              {/* Owner Section */}
              <div className="bg-slate-50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Wallet className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg">Owner Information</h4>
                </div>
                
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 mb-2 font-medium">Wallet Address</p>
                      <div className="space-y-1">
                        <p className="font-mono text-sm text-gray-900 break-all sm:hidden font-medium">
                          {formatAddress(domainInfo.owner)}
                        </p>
                        <p className="font-mono text-sm text-gray-900 break-all hidden sm:block font-medium">
                          {domainInfo.owner}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(domainInfo.owner)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
                        title="Copy address"
                      >
                        <Copy className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                      </button>
                      <a
                        href={`https://pepuscan.com/address/${domainInfo.owner}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
                        title="View on explorer"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expiry Section */}
              <div className="bg-orange-50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 rounded-xl">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg">Registration Details</h4>
                </div>
                
                <div className="bg-white rounded-xl p-4 text-center border border-orange-200 shadow-sm">
                  <p className="text-sm text-gray-600 mb-2 font-medium">Expires On</p>
                  <p className="text-xl font-bold text-gray-900 mb-2">
                    {formatDate(domainInfo.expiry)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Registration valid until this date
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
