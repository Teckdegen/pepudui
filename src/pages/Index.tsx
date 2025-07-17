
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Search, ExternalLink, Twitter, Send, MessageCircle, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDomain, isValidFullDomain, hasBannedWords, extractDomainName } from '../lib/domain-utils';
import { PaymentVerification } from '../components/PaymentVerification';
import { useToast } from '@/hooks/use-toast';

// Generate many floating domain names (increased to make it feel like "a million")
const generateFloatingDomains = () => {
  const prefixes = [
    'crypto', 'moon', 'frog', 'meme', 'defi', 'web3', 'nft', 'dao', 'dex', 'yield',
    'stake', 'farm', 'mint', 'burn', 'swap', 'pool', 'whale', 'ape', 'diamond', 'hodl',
    'bull', 'bear', 'pump', 'dump', 'rekt', 'fomo', 'yolo', 'alpha', 'beta', 'gamma',
    'token', 'coin', 'chain', 'block', 'hash', 'node', 'peer', 'sync', 'fork', 'merge',
    'layer', 'cross', 'bridge', 'wrap', 'unwrap', 'lock', 'unlock', 'claim', 'reward', 'bonus',
    'rare', 'epic', 'legend', 'ultra', 'super', 'mega', 'giga', 'tera', 'peta', 'quantum',
    'cyber', 'neural', 'matrix', 'pixel', 'retro', 'neo', 'hyper', 'ultra', 'prime', 'omega',
    'storm', 'thunder', 'lightning', 'fire', 'ice', 'water', 'earth', 'wind', 'void', 'light',
    'dark', 'shadow', 'bright', 'shine', 'glow', 'spark', 'flash', 'beam', 'ray', 'wave',
    'flow', 'stream', 'river', 'ocean', 'sea', 'lake', 'pond', 'pool', 'drop', 'bubble',
    'pepe', 'pepeu', 'kek', 'based', 'cringe', 'cope', 'seethe', 'mald', 'wojak', 'chad',
    'gigachad', 'sigma', 'beta', 'alpha', 'normie', 'coomer', 'doomer', 'boomer', 'zoomer'
  ];
  
  return Array.from({ length: 300 }, (_, i) => 
    `${prefixes[Math.floor(Math.random() * prefixes.length)]}.pepu`
  );
};

const FLOATING_DOMAINS = generateFloatingDomains();

const Index = () => {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [domainCount, setDomainCount] = useState(0);
  const [ownedDomain, setOwnedDomain] = useState<string | null>(null);
  const [availability, setAvailability] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>('');

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
        setSelectedDomain(fullDomain);
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
    setShowPayment(false);
  };

  // Handle search keydown
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkAvailability();
    }
  };

  // Handle register domain
  const handleRegister = () => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to register a domain",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDomain) {
      toast({
        title: "No Domain Selected",
        description: "Please search for and select an available domain first",
        variant: "destructive",
      });
      return;
    }

    setShowPayment(true);
  };

  // Handle payment success
  const handlePaymentSuccess = () => {
    setShowPayment(false);
    fetchDomainCount();
    fetchOwnedDomain();
    setSearchQuery('');
    setAvailability('');
    setSelectedDomain('');
    toast({
      title: "Registration Successful!",
      description: `${selectedDomain} has been registered successfully`,
    });
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    toast({
      title: "Registration Failed",
      description: error,
      variant: "destructive",
    });
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
  const canRegister = availability.includes('available') && selectedDomain && !hasOwnedDomain && !isLimitReached;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
      {/* Floating domains - many more now */}
      {FLOATING_DOMAINS.map((domain, index) => (
        <div
          key={`${domain}-${index}`}
          className="absolute text-xs md:text-sm font-medium text-white/20 pointer-events-none select-none animate-float"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 20}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }}
        >
          {domain}
        </div>
      ))}

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/lovable-uploads/7f638e99-5349-4494-b07d-38081fecd1de.png" alt="Pepu" className="w-10 h-10 rounded-full" />
            <h1 className="text-2xl font-bold text-white">Pepu Names</h1>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <div className="text-center space-y-12">
          {/* Hero section */}
          <div className="space-y-8">
            <h2 className="text-6xl md:text-7xl font-bold text-white mb-6">
              Simplify on
            </h2>
            <h3 className="text-4xl md:text-5xl font-bold text-white/90">
              Your <span className="text-yellow-300">.pepu</span> Identity
            </h3>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Register unique domains on Pepe Unchained V2 blockchain. 
              <span className="text-yellow-300 font-semibold"> Only $5 USDC</span> - 
              <span className="text-orange-300 font-bold"> Limited time discount!</span>
            </p>
          </div>

          {/* Payment verification modal */}
          {showPayment && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="max-w-md w-full">
                <PaymentVerification
                  walletAddress={address || ''}
                  domainName={selectedDomain}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
                <button
                  onClick={() => setShowPayment(false)}
                  className="mt-4 w-full px-4 py-2 text-white/80 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Search section - main focus */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 max-w-3xl mx-auto shadow-2xl">
            <div className="space-y-6">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="SEARCH FOR A NAME"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="w-full px-6 py-4 text-lg border-0 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                    disabled={isLoading}
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    .pepu
                  </span>
                </div>
                <button
                  onClick={checkAvailability}
                  disabled={isLoading}
                  className="px-8 py-4 bg-black text-white rounded-2xl hover:bg-gray-800 transition-colors flex items-center gap-2 font-medium"
                >
                  <Search className="w-5 h-5" />
                  {isLoading ? 'Searching...' : ''}
                </button>
              </div>

              {availability && (
                <div className={`text-lg font-medium ${
                  availability.includes('available') ? 'text-green-600' : 
                  availability.includes('taken') ? 'text-red-600' : 'text-orange-600'
                }`}>
                  {availability}
                </div>
              )}

              {error && <div className="text-red-600 font-medium">{error}</div>}

              {/* Register button */}
              {canRegister && (
                <button
                  onClick={handleRegister}
                  className="w-full px-6 py-3 bg-yellow-500 text-black rounded-2xl hover:bg-yellow-400 transition-colors font-medium text-lg"
                >
                  Register for $5 USDC
                </button>
              )}
            </div>
          </div>

          {/* Stats section - clean design */}
          <div className="text-center">
            <div className="text-8xl font-bold text-white mb-2">
              {domainCount}/1000
            </div>
            <div className="text-xl text-white/80">
              domains registered
            </div>
            {domainCount < 1000 && (
              <div className="text-lg text-yellow-300 mt-3 font-medium">
                🔥 Discount price: Only {1000 - domainCount} left!
              </div>
            )}
          </div>

          {/* Owned domain display */}
          {isConnected && hasOwnedDomain && (
            <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-3xl p-6 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-lg text-white/80 mb-2">You own:</div>
                <div className="text-2xl font-bold text-yellow-300">{ownedDomain}</div>
              </div>
            </div>
          )}

          {/* Registration section */}
          {!isConnected ? (
            <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-3xl p-8 max-w-md mx-auto text-center">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Ready to claim your domain?</h3>
                <p className="text-white/80">
                  Connect your wallet using the button above to register a .pepu domain
                </p>
              </div>
            </div>
          ) : isLimitReached ? (
            <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-3xl p-8 max-w-md mx-auto text-center">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-red-300">Limit Reached</h3>
                <p className="text-white/80">
                  All 1,000 domains have been registered!
                </p>
              </div>
            </div>
          ) : hasOwnedDomain ? (
            <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-3xl p-8 max-w-md mx-auto text-center">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-yellow-300">Already Registered</h3>
                <p className="text-white/80">
                  You can only register one domain per wallet
                </p>
              </div>
            </div>
          ) : null}

          {/* Info section */}
          <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-3xl p-8 max-w-3xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-yellow-300 mb-2">$5 USDC</div>
                <div className="text-white/80">Discount price for first 1,000 domains</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-300 mb-2">1/wallet</div>
                <div className="text-white/80">One domain per wallet limit</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-300 mb-2">Unique</div>
                <div className="text-white/80">All domain names are unique</div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="text-center">
            <div className="text-white/60 text-lg mb-4">Scroll to explore</div>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto">
              <div className="w-1 h-4 bg-white/60 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/20 mt-20">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center space-y-8">
            <h3 className="text-2xl font-bold text-white">Join Our Community</h3>
            
            <div className="flex justify-center gap-6">
              <a
                href="https://x.com/pepeutoken"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <Twitter className="w-5 h-5" />
                Twitter
              </a>
              <a
                href="https://t.me/pepeunchained"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <Send className="w-5 h-5" />
                Telegram
              </a>
              <a
                href="https://discord.gg/pepeunchained"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Discord
              </a>
              <a
                href="https://pepeunchained.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <Globe className="w-5 h-5" />
                Website
              </a>
            </div>

            <div className="flex justify-center items-center gap-2 text-sm text-white/60">
              <span>Built on</span>
              <a
                href="https://pepuscan.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-300 hover:text-yellow-200 transition-colors flex items-center gap-1"
              >
                Pepe Unchained V2
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-sm text-white/60">
              © 2025 Pepu Name Service. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
