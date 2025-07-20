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
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200/80 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <ScrollArea className="h-full max-h-[250px]">
        <div className="space-y-4 pr-4">
          {/* Domain name header */}
          <div className="text-center pb-4 border-b border-gray-100">
            <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text break-all mb-2">
              {domainInfo.name}
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
              <Shield className="w-4 h-4" />
              Registered
            </div>
          </div>

          {/* Owner info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Owner</p>
                <p className="font-mono text-sm font-medium text-gray-800">
                  {formatAddress(domainInfo.owner)}
                </p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(domainInfo.owner)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Copy address"
            >
              <Copy className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Expiry info */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Calendar className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Expires</p>
              <p className="font-medium text-gray-800">
                {formatDate(domainInfo.expiry)}
              </p>
            </div>
          </div>

          {/* View details button */}
          <button
            onClick={onViewDetails}
            className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg"
          >
            <span>View Full Details</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </ScrollArea>
    </div>
  );
};
