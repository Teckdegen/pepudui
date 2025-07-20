import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Search, Sparkles, Star, Settings, Clock, User, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDomain, isValidFullDomain, hasBannedWords, extractDomainName } from '../lib/domain-utils';
import { PaymentVerification } from '../components/PaymentVerification';
import { DomainInfoModal } from '../components/DomainInfoModal';
import { useToast } from '@/hooks/use-toast';
import { DomainInfoCard } from '@/components/DomainInfoCard';

// Generate floating domain names for background effect
const generateFloatingDomains = () => {
  const prefixes = [
    'crypto', 'moon', 'frog', 'meme', 'defi', 'web3', 'nft', 'dao', 'dex', 'yield',
    'stake', 'farm', 'mint', 'burn', 'swap', 'pool', 'whale', 'ape', 'diamond', 'hodl',
    'bull', 'bear', 'pump', 'dump', 'rekt', 'fomo', 'yolo', 'alpha', 'beta', 'gamma',
    'token', 'coin', 'chain', 'block', 'hash', 'node', 'peer', 'sync', 'fork', 'merge',
    'pepe', 'pepeu', 'kek', 'based', 'cringe', 'cope', 'seethe', 'mald', 'wojak', 'chad',
    'rocket', 'star', 'galaxy', 'cosmos', 'nebula', 'planet', 'asteroid', 'comet', 'lunar', 'solar',
    'digital', 'virtual', 'augmented', 'reality', 'metaverse', 'avatar', 'hologram', 'portal', 'nexus'
  ];
  
  return Array.from({ length: 200 }, (_, i) => 
    `${prefixes[Math.floor(Math.random() * prefixes.length)]}.pepu`
  );
};

const FLOATING_DOMAINS = generateFloatingDomains();

const Index = () => {
  const { address, isConnected, chainId } = useAccount();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [domainCount, setDomainCount] = useState(0);
  const [ownedDomain, setOwnedDomain] = useState<string | null>(null);
  const [ownedDomainExpiry, setOwnedDomainExpiry] = useState<string | null>(null);
  const [availability, setAvailability] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [takenDomainInfo, setTakenDomainInfo] = useState<{owner: string, expiry: string, name: string} | null>(null);
  const [showDomainInfo, setShowDomainInfo] = useState(false);

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

  // Enhanced check for owned domain to prevent registration
  const fetchOwnedDomain = async () => {
    if (!address) {
      setOwnedDomain(null);
      setOwnedDomainExpiry(null);
      return;
    }

    console.log('Checking for owned domains for address:', address);
    
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('name, expiry')
        .eq('owner', address.toLowerCase())
        .eq('paid', true)
        .maybeSingle();
      
      if (error) throw error;
      
      console.log('Owned domain data:', data);
      setOwnedDomain(data?.name || null);
      setOwnedDomainExpiry(data?.expiry || null);
    } catch (err) {
      console.error('Error fetching owned domain:', err);
      setOwnedDomain(null);
      setOwnedDomainExpiry(null);
    }
  };

  // Check domain availability
  const checkAvailability = async () => {
    setError('');
    setAvailability('');
    setTakenDomainInfo(null);
    
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
        .select('name, owner, expiry')
        .eq('name', fullDomain)
        .eq('paid', true)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setAvailability('Domain is taken');
        setTakenDomainInfo({
          name: data.name,
          owner: data.owner,
          expiry: data.expiry
        });
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

  // Enhanced register handler with ownership check
  const handleRegister = () => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to register a domain",
        variant: "destructive",
      });
      return;
    }

    if (hasOwnedDomain) {
      toast({
        title: "Domain Limit Reached",
        description: "This wallet already owns a domain. Only one domain per wallet is allowed.",
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

  // Handle clicking outside payment modal
  const handlePaymentBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowPayment(false);
    }
  };

  // Handle domain info click
  const handleDomainInfoClick = () => {
    if (takenDomainInfo) {
      setShowDomainInfo(true);
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
  const canRegister = availability.includes('available') && selectedDomain && !hasOwnedDomain && !isLimitReached;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/30 relative overflow-hidden">
      {/* Floating domains background - hidden on small screens for performance */}
      <div className="hidden md:block">
        {FLOATING_DOMAINS.map((domain, index) => (
          <div
            key={`${domain}-${index}`}
            className="absolute text-xs lg:text-sm font-medium text-blue-600/10 pointer-events-none select-none animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${15 + Math.random() * 25}s`,
              fontSize: `${0.7 + Math.random() * 0.8}rem`,
              opacity: 0.08 + Math.random() * 0.15,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          >
            {domain}
          </div>
        ))}
      </div>

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/20 via-transparent to-yellow-50/20 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 p-3 md:p-6 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative">
              <img src="/lovable-uploads/90659ea0-5d26-4342-9a87-0c004e40af4d.png" alt="Pepu" className="w-8 h-8 md:w-12 md:h-12 rounded-full shadow-lg" />
              <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Pepu Names
              </h1>
              <p className="text-xs text-gray-500 hidden md:block">Decentralized Identity</p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-1 shadow-lg">
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-4xl mx-auto px-3 md:px-6 py-6 md:py-12">
        <div className="text-center space-y-6 md:space-y-12">
          {/* Hero section */}
          <div className="space-y-4 md:space-y-8">
            <div className="relative">
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-3 md:mb-6">
                Your Web3 Identity
              </h2>
              <Sparkles className="absolute top-0 right-1/4 w-6 h-6 md:w-8 md:h-8 text-yellow-400 animate-pulse" />
              <Star className="absolute bottom-0 left-1/4 w-4 h-4 md:w-6 md:h-6 text-purple-400 animate-bounce" />
            </div>
            <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-800">
              Get Your <span className="text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text">.pepu</span> Domain
            </h3>
            <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Register unique domains on Pepe Unchained V2 blockchain. 
              <span className="text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text font-bold"> Only $5 USDC</span> - 
              <span className="text-transparent bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text font-bold"> Limited time discount!</span>
            </p>
          </div>

          {/* Enhanced Domain Management for existing owners */}
          {isConnected && hasOwnedDomain && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-3xl p-6 md:p-8 max-w-2xl mx-auto backdrop-blur-sm shadow-lg">
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-3">
                  <Settings className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-xl md:text-2xl font-bold text-emerald-700">Your Domain</h3>
                </div>
                
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 space-y-4 border border-white/60">
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text break-all mb-3">
                      {ownedDomain}
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      <Shield className="w-4 h-4" />
                      Active Registration
                    </div>
                  </div>
                  
                  {ownedDomainExpiry && (
                    <div className="flex items-center justify-center gap-2 text-gray-600 pt-4 border-t border-gray-100">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        Expires: {new Date(ownedDomainExpiry).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <button
                      disabled
                      className="w-full px-6 py-3 bg-gradient-to-r from-gray-300 to-gray-400 text-gray-600 rounded-xl font-bold text-lg cursor-not-allowed opacity-75"
                    >
                      Domain Management - Coming Soon
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment verification modal */}
          {showPayment && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={handlePaymentBackdropClick}
            >
              <PaymentVerification
                walletAddress={address || ''}
                domainName={selectedDomain}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          )}

          {/* Domain Info Modal */}
          {showDomainInfo && takenDomainInfo && (
            <DomainInfoModal
              domainInfo={takenDomainInfo}
              onClose={() => setShowDomainInfo(false)}
            />
          )}

          {/* Enhanced Search section */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-8 max-w-3xl mx-auto shadow-2xl border border-white/60 relative overflow-hidden">
            <div className="space-y-6 relative">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search for a domain name..."
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="w-full px-6 py-4 text-lg border-0 bg-white/95 backdrop-blur-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white placeholder-gray-500 shadow-inner pr-16 transition-all duration-300"
                    disabled={isLoading}
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text font-bold text-base">
                    .pepu
                  </span>
                </div>
                <button
                  onClick={checkAvailability}
                  disabled={isLoading}
                  className="px-8 py-4 bg-gradient-to-r from-black to-gray-800 text-white rounded-2xl hover:from-gray-800 hover:to-black transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transform active:scale-95 min-w-[140px]"
                >
                  <Search className="w-5 h-5" />
                  <span className="hidden md:inline">{isLoading ? 'Searching...' : 'Search'}</span>
                </button>
              </div>

              {availability && (
                <div className="space-y-4">
                  <div className={`text-lg font-bold transition-all duration-300 ${
                    availability.includes('available') ? 'text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text' : 
                    availability.includes('taken') ? 'text-transparent bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text' : 
                    'text-transparent bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text'
                  }`}>
                    {availability}
                  </div>
                  
                  {/* Enhanced taken domain display */}
                  {availability.includes('taken') && takenDomainInfo && (
                    <div className="flex justify-center">
                      <DomainInfoCard
                        domainInfo={takenDomainInfo}
                        onViewDetails={handleDomainInfoClick}
                      />
                    </div>
                  )}
                </div>
              )}

              {error && <div className="text-red-600 font-medium">{error}</div>}

              {/* Enhanced Register button with ownership check */}
              {canRegister && (
                <button
                  onClick={handleRegister}
                  className="w-full px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-2xl hover:from-yellow-400 hover:to-orange-400 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform active:scale-95"
                >
                  Register for $5 USDC
                </button>
              )}

              {/* Ownership warning */}
              {availability.includes('available') && hasOwnedDomain && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <AlertCircle className="w-5 h-5 mr-2 text-amber-600" />
                    <p className="font-semibold text-amber-700">Registration Blocked</p>
                  </div>
                  <p className="text-sm text-amber-600">
                    This wallet already owns <span className="font-medium">{ownedDomain}</span>. Only one domain per wallet is allowed.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Stats section */}
          <div className="text-center">
            <div className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {domainCount}/1000
            </div>
            <div className="text-lg md:text-xl text-gray-600">
              domains registered
            </div>
            {domainCount < 1000 && (
              <div className="text-base md:text-lg text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text mt-3 font-bold px-4">
                Discount price: Only {1000 - domainCount} left!
              </div>
            )}
          </div>

          {/* Owned domain display */}
          {isConnected && hasOwnedDomain && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl md:rounded-3xl p-4 md:p-6 max-w-md mx-auto backdrop-blur-sm">
              <div className="text-center">
                <div className="text-base md:text-lg text-gray-600 mb-2">You own:</div>
                <div className="text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text break-all">{ownedDomain}</div>
              </div>
            </div>
          )}

          {/* Status messages */}
          {!isConnected ? (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-md mx-auto text-center backdrop-blur-sm">
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-semibold text-blue-600">Ready to claim your domain?</h3>
                <p className="text-sm md:text-base text-gray-600">
                  Connect your wallet to register a .pepu domain
                </p>
              </div>
            </div>
          ) : isLimitReached ? (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-md mx-auto text-center backdrop-blur-sm">
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-semibold text-red-600">Limit Reached</h3>
                <p className="text-sm md:text-base text-gray-600">
                  All 1,000 domains have been registered!
                </p>
              </div>
            </div>
          ) : hasOwnedDomain ? (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-md mx-auto text-center backdrop-blur-sm">
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-semibold text-yellow-600">Already Registered</h3>
                <p className="text-sm md:text-base text-gray-600">
                  You can only register one domain per wallet
                </p>
              </div>
            </div>
          ) : null}

          {/* Info section */}
          <div className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl md:rounded-3xl p-4 md:p-8 max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 text-center">
              <div className="space-y-2">
                <div className="text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text">$5 USDC</div>
                <div className="text-sm md:text-base text-gray-600">Discount price for first 1,000 domains</div>
              </div>
              <div className="space-y-2">
                <div className="text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text">1/wallet</div>
                <div className="text-sm md:text-base text-gray-600">One domain per wallet limit</div>
              </div>
              <div className="space-y-2">
                <div className="text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text">Unique</div>
                <div className="text-sm md:text-base text-gray-600">All domain names are unique</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200/50 mt-12 md:mt-20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-3 md:px-6 py-8 md:py-12 text-center">
          <p className="text-xs md:text-sm text-gray-500">
            2025 Pepu Name Service. Built on Pepe Unchained V2.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
