import React from 'react';
import { User, Calendar, Shield, ExternalLink, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DomainInfoCardProps {
  domainInfo: {
    name: string;
    owner: string;
    expiry: string;
  };
  onViewDetails: () => void;
}

export const DomainInfoCard = ({ domainInfo, onViewDetails }: DomainInfoCardProps) => {
  const { toast } = useToast();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  return (
    <div className="bg-white/95 backdrop-blur-md border border-gray-200/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 group max-w-sm mx-auto">
      <ScrollArea className="h-full max-h-[280px] sm:max-h-[300px]">
        <div className="space-y-3 sm:space-y-4 pr-2">
          {/* Domain name header */}
          <div className="text-center pb-3 sm:pb-4 border-b border-gray-100/80">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-transparent bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text break-all mb-2 leading-tight">
              {domainInfo.name}
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50/80 text-green-700 rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
              Registered
            </div>
          </div>

          {/* Owner info */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 bg-blue-50/80 rounded-lg backdrop-blur-sm">
                <User className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500">Owner</p>
                <p className="font-mono text-xs sm:text-sm font-medium text-gray-800 truncate">
                  {formatAddress(domainInfo.owner)}
                </p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(domainInfo.owner)}
              className="p-1.5 sm:p-2 hover:bg-gray-100/80 rounded-lg transition-all duration-200 hover:scale-105 flex-shrink-0"
              title="Copy address"
            >
              <Copy className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
            </button>
          </div>

          {/* Expiry info */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-orange-50/80 rounded-lg backdrop-blur-sm">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-500">Expires</p>
              <p className="font-medium text-xs sm:text-sm text-gray-800 break-words">
                {formatDate(domainInfo.expiry)}
              </p>
            </div>
          </div>

          {/* View details button */}
          <button
            onClick={onViewDetails}
            className="w-full mt-3 sm:mt-4 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg sm:rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg hover:scale-105 text-sm sm:text-base"
          >
            <span>View Details</span>
            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </ScrollArea>
    </div>
  );
};
