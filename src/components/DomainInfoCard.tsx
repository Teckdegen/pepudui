
import React from 'react';
import { User, Calendar, Shield, ExternalLink, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 max-w-sm mx-auto">
      <div className="space-y-4">
        {/* Domain name header */}
        <div className="text-center pb-4 border-b border-gray-100">
          <div className="text-xl font-bold text-transparent bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text break-all mb-3">
            {domainInfo.name}
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold">
            <Shield className="w-4 h-4" />
            Registered
          </div>
        </div>

        {/* Owner info */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-blue-50 rounded-xl">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-600 font-medium">Owner</p>
              <p className="font-mono text-sm font-semibold text-gray-900 truncate">
                {formatAddress(domainInfo.owner)}
              </p>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(domainInfo.owner)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Copy address"
          >
            <Copy className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Expiry info */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-xl">
            <Calendar className="w-4 h-4 text-orange-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-600 font-medium">Expires</p>
            <p className="font-semibold text-sm text-gray-900">
              {formatDate(domainInfo.expiry)}
            </p>
          </div>
        </div>

        {/* View details button */}
        <button
          onClick={onViewDetails}
          className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          <span>View Details</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
