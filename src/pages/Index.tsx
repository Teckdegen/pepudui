
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Search, ExternalLink, Twitter, Send, MessageCircle, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDomain, isValidFullDomain, hasBannedWords, extractDomainName } from '../lib/domain-utils';
import pepeIcon from '../assets/pepe-icon.png';

const FLOATING_DOMAINS = [
  'crypto.pepu', 'moon.pepu', 'frog.pepu', 'meme.pepu', 'defi.pepu', 'web3.pepu'
];

const Index = () => {
  const { address, isConnected } = useAccount();
  const [searchQuery, setSearchQuery] = useState('');
  const [domainCount, setDomainCount] = useState(0);
  const [ownedDomain, setOwnedDomain] = useState<string | null>(null);
  const [availability, setAvailability] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch domain count from Supabase
  const fetchDomainCount = async () => {
    try {
      const { count, error } = await supabase
        .from('domains')
        .select('*', { count: 'exact', head: true })
        .eq('paid', true);
      
      if (error) throw error;
      setDomainCount(count || 0);
    } catch (err) {
      console.error('Error fetching domain count:', err);
    }
  };

  // Fetch owned domain for connected wallet
  const fetchOwnedDomain = async () => {
    if (!address) {
      setOwnedDomain(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('domains')
        .select('name')
        .eq('owner', address.toLowerCase())
        .eq('paid', true)
        .maybeSingle();
      
      if (error) throw error;
      setOwnedDomain(data?.name || null);
    } catch (err) {
      console.error('Error fetching owned domain:', err);
      setOwnedDomain(null);
    }
  };

  // Check domain availability
  const checkAvailability = async () => {
    setError('');
    setAvailability('');
    
    if (!searchQuery.trim()) {
      setAvailability('Please enter a domain name');
      return;
    }

    const fullDomain = formatDomain(searchQuery);
    const domainName = extractDomainName(fullDomain);

    // Check for banned words
    if (hasBannedWords(domainName)) {
      setAvailability('This domain name is not available');
      return;
    }

    // Check format
    if (!isValidFullDomain(fullDomain)) {
      setAvailability('Invalid domain format. Use alphanumeric characters and hyphens only');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('name')
        .eq('name', fullDomain)
        .eq('paid', true)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setAvailability('Domain is taken');
      } else {
        setAvailability('Domain is available! 🎉');
      }
    } catch (err) {
      console.error('Error checking availability:', err);
      setAvailability('Error checking availability');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    setAvailability('');
    setError('');
  };

  // Auto-add .pepu when user types
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkAvailability();
    }
  };

  useEffect(() => {
    fetchDomainCount();
    fetchOwnedDomain();
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchDomainCount();
      fetchOwnedDomain();
    }, 30000);

    return () => clearInterval(interval);
  }, [address]);

  const isLimitReached = domainCount >= 1000;
  const hasOwnedDomain = ownedDomain !== null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Floating domains */}
      {FLOATING_DOMAINS.map((domain, index) => (
        <div
          key={domain}
          className={`floating-domain floating-domain-${index + 1}`}
          style={{ animationDelay: `${index * -3}s` }}
        >
          {domain}
        </div>
      ))}

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={pepeIcon} alt="Pepu" className="w-10 h-10" />
            <h1 className="text-2xl font-bold text-primary">Pepu Name Service</h1>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <div className="text-center space-y-8">
          {/* Hero section */}
          <div className="space-y-6">
            <h2 className="text-5xl font-bold text-foreground">
              Your <span className="text-primary">.pepu</span> Identity
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Register unique domains on Pepe Unchained V2 blockchain. 
              <span className="text-secondary font-semibold"> Only $5 USDC</span> - 
              <span className="text-destructive font-bold"> Limited time discount!</span>
            </p>
          </div>

          {/* Search section */}
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <div className="space-y-6">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Enter domain name (e.g., teck)"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="search-input pr-16"
                    disabled={isLoading}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    .pepu
                  </span>
                </div>
                <button
                  onClick={checkAvailability}
                  disabled={isLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  {isLoading ? 'Checking...' : 'Check'}
                </button>
              </div>

              {availability && (
                <div className={`text-lg ${
                  availability.includes('available') ? 'status-available' : 
                  availability.includes('taken') ? 'status-taken' : 'status-error'
                }`}>
                  {availability}
                </div>
              )}

              {error && <div className="status-error">{error}</div>}
            </div>
          </div>

          {/* Stats section */}
          <div className="glass-card p-6 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {domainCount} / 1,000
              </div>
              <div className="text-muted-foreground">
                Domains registered
              </div>
              {domainCount < 1000 && (
                <div className="text-sm status-discount mt-2">
                  🔥 Discount price: Only {1000 - domainCount} left!
                </div>
              )}
            </div>
          </div>

          {/* Owned domain display */}
          {isConnected && hasOwnedDomain && (
            <div className="glass-card p-6 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-lg text-muted-foreground mb-2">You own:</div>
                <div className="text-2xl font-bold text-primary">{ownedDomain}</div>
              </div>
            </div>
          )}

          {/* Registration section */}
          {!isConnected ? (
            <div className="glass-card p-8 max-w-md mx-auto text-center">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Ready to claim your domain?</h3>
                <p className="text-muted-foreground">
                  Connect your wallet to register a .pepu domain
                </p>
                <ConnectButton />
              </div>
            </div>
          ) : isLimitReached ? (
            <div className="glass-card p-8 max-w-md mx-auto text-center">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-destructive">Limit Reached</h3>
                <p className="text-muted-foreground">
                  All 1,000 domains have been registered!
                </p>
              </div>
            </div>
          ) : hasOwnedDomain ? (
            <div className="glass-card p-8 max-w-md mx-auto text-center">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-secondary">Already Registered</h3>
                <p className="text-muted-foreground">
                  You can only register one domain per wallet
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 max-w-md mx-auto text-center">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">🚧 Registration Coming Soon</h3>
                <p className="text-muted-foreground">
                  Smart contract integration is being finalized. 
                  You can check domain availability now!
                </p>
                <p className="text-sm status-discount">
                  Get ready to register for just $5 USDC
                </p>
              </div>
            </div>
          )}

          {/* Info section */}
          <div className="glass-card p-8 max-w-3xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-primary mb-2">$5 USDC</div>
                <div className="text-muted-foreground">Discount price for first 1,000 domains</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary mb-2">1/wallet</div>
                <div className="text-muted-foreground">One domain per wallet limit</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary mb-2">Unique</div>
                <div className="text-muted-foreground">All domain names are unique</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 mt-20">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center space-y-8">
            <h3 className="text-2xl font-bold text-primary">Join Our Community</h3>
            
            <div className="flex justify-center gap-6">
              <a
                href="https://x.com/pepeutoken"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="w-5 h-5" />
                Twitter
              </a>
              <a
                href="https://t.me/pepeunchained"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Send className="w-5 h-5" />
                Telegram
              </a>
              <a
                href="https://discord.gg/pepeunchained"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Discord
              </a>
              <a
                href="https://pepeunchained.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Globe className="w-5 h-5" />
                Website
              </a>
            </div>

            <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground">
              <span>Built on</span>
              <a
                href="https://pepuscan.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-glow transition-colors flex items-center gap-1"
              >
                Pepe Unchained V2
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-sm text-muted-foreground">
              © 2025 Pepu Name Service. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
