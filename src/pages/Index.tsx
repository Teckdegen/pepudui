import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Search, Sparkles, Star, Settings, Clock, User, Calendar, AlertCircle, Shield, Zap, Globe, Crown } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-purple-50/50 relative overflow-hidden">
      {/* Enhanced floating domains background */}
      <div className="hidden lg:block">
        {FLOATING_DOMAINS.map((domain, index) => (
          <div
            key={`${domain}-${index}`}
            className="absolute text-xs xl:text-sm font-medium text-blue-600/8 pointer-events-none select-none animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${20 + Math.random() * 30}s`,
              fontSize: `${0.6 + Math.random() * 0.9}rem`,
              opacity: 0.04 + Math.random() * 0.08,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          >
            {domain}
          </div>
        ))}
      </div>

      {/* Enhanced gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-yellow-500/5 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent pointer-events-none" />

      {/* Enhanced Header */}
      <header className="relative z-10 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative">
                  <img 
                    src="/lovable-uploads/90659ea0-5d26-4342-9a87-0c004e40af4d.png" 
                    alt="Pepu" 
                    className="w-10 h-10 lg:w-14 lg:h-14 rounded-full shadow-xl border-2 border-white/80" 
                  />
                  <div className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse shadow-lg"></div>
                </div>
              </div>
              <div>
                <h1 className="text-xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent">
                  Pepu Names
                </h1>
                <p className="text-sm lg:text-base text-gray-600 font-medium hidden sm:block">
                  Your Web3 Identity Platform
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl lg:rounded-3xl p-1 shadow-2xl border border-white/60">
                <ConnectButton 
                  showBalance={false}
                  chainStatus="icon"
                  accountStatus={{
                    smallScreen: 'avatar',
                    largeScreen: 'full',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Main content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 lg:px-6 py-8 lg:py-16">
        <div className="text-center space-y-8 lg:space-y-16">
          {/* Enhanced Hero section */}
          <div className="space-y-6 lg:space-y-12">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-yellow-500/20 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
              <div className="relative">
                <h2 className="text-5xl lg:text-7xl xl:text-8xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent mb-4 lg:mb-8 leading-tight">
                  Own Your
                  <br />
                  <span className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                    .pepu
                  </span>
                  <br />
                  Identity
                </h2>
                <div className="absolute top-0 right-0 lg:right-1/4">
                  <Sparkles className="w-8 h-8 lg:w-12 lg:h-12 text-yellow-400 animate-pulse" />
                </div>
                <div className="absolute bottom-0 left-0 lg:left-1/4">
                  <Star className="w-6 h-6 lg:w-10 lg:h-10 text-purple-400 animate-bounce" />
                </div>
                <div className="absolute top-1/2 right-0">
                  <Crown className="w-6 h-6 lg:w-8 lg:h-8 text-orange-400 animate-pulse" />
                </div>
              </div>
            </div>
            
            <div className="max-w-4xl mx-auto space-y-4 lg:space-y-6">
              <p className="text-xl lg:text-2xl xl:text-3xl font-bold text-gray-800 leading-relaxed">
                Secure Your Premium Web3 Domain
              </p>
              <p className="text-lg lg:text-xl text-gray-600 leading-relaxed px-4">
                Join the decentralized revolution with your unique 
                <span className="font-bold text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text"> .pepu </span>
                domain for just 
                <span className="font-black text-transparent bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text"> $5 USDC</span>
              </p>
              
              {/* Enhanced feature badges */}
              <div className="flex flex-wrap justify-center gap-3 lg:gap-4 pt-6">
                <div className="flex items-center gap-2 px-4 py-2 lg:px-6 lg:py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full">
                  <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
                  <span className="text-sm lg:text-base font-semibold text-blue-700">Secure</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 lg:px-6 lg:py-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-full">
                  <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600" />
                  <span className="text-sm lg:text-base font-semibold text-purple-700">Fast</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 lg:px-6 lg:py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full">
                  <Globe className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />
                  <span className="text-sm lg:text-base font-semibold text-green-700">Global</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Domain Management for existing owners */}
          {isConnected && hasOwnedDomain && (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-3xl p-8 lg:p-12 max-w-3xl mx-auto shadow-2xl">
                <div className="space-y-8">
                  <div className="flex items-center justify-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-xl">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-emerald-800">Your Premium Domain</h3>
                  </div>
                  
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                    <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/60">
                      <div className="text-center space-y-6">
                        <div className="text-3xl lg:text-4xl font-black text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text break-all">
                          {ownedDomain}
                        </div>
                        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-lg font-bold shadow-lg">
                          <Shield className="w-5 h-5" />
                          Premium Registration Active
                        </div>
                        
                        {ownedDomainExpiry && (
                          <div className="flex items-center justify-center gap-3 text-gray-600 pt-4 border-t border-gray-200">
                            <Calendar className="w-5 h-5" />
                            <span className="text-base lg:text-lg">
                              Valid until: {new Date(ownedDomainExpiry).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Search section */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition duration-300"></div>
            <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-6 lg:p-10 max-w-4xl mx-auto shadow-2xl border border-white/60">
              <div className="space-y-8">
                <div className="text-center space-y-4">
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-800">Find Your Perfect Domain</h3>
                  <p className="text-gray-600 text-lg">Search for available .pepu domains</p>
                </div>
                
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-300"></div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter your desired domain name..."
                        value={searchQuery}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        className="w-full px-8 py-5 text-xl border-0 bg-white/95 backdrop-blur-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white placeholder-gray-500 shadow-inner pr-20 transition-all duration-300"
                        disabled={isLoading}
                      />
                      <span className="absolute right-8 top-1/2 -translate-y-1/2 text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text font-bold text-xl">
                        .pepu
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={checkAvailability}
                    disabled={isLoading}
                    className="px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-3 font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 active:scale-95 min-w-[180px]"
                  >
                    <Search className="w-6 h-6" />
                    {isLoading ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {/* Enhanced availability display */}
                {availability && (
                  <div className="space-y-6">
                    <div className={`text-xl lg:text-2xl font-bold transition-all duration-300 ${
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

                {error && (
                  <div className="text-red-600 font-semibold text-lg bg-red-50 p-4 rounded-xl border border-red-200">
                    {error}
                  </div>
                )}

                {/* Enhanced Register button */}
                {canRegister && (
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                    <button
                      onClick={handleRegister}
                      className="relative w-full px-8 py-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-2xl hover:from-yellow-400 hover:to-orange-400 transition-all duration-300 font-black text-xl lg:text-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 active:scale-95"
                    >
                      <span className="flex items-center justify-center gap-3">
                        <Crown className="w-6 h-6" />
                        Register Premium Domain - $5 USDC
                        <Sparkles className="w-6 h-6" />
                      </span>
                    </button>
                  </div>
                )}

                {/* Enhanced ownership warning */}
                {availability.includes('available') && hasOwnedDomain && (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 text-center shadow-lg">
                    <div className="flex items-center justify-center mb-3">
                      <AlertCircle className="w-6 h-6 mr-3 text-amber-600" />
                      <p className="font-bold text-amber-800 text-lg">Registration Blocked</p>
                    </div>
                    <p className="text-amber-700 text-base">
                      This wallet already owns <span className="font-bold">{ownedDomain}</span>. Only one domain per wallet is allowed.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Stats section */}
          <div className="text-center space-y-6">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative">
                <div className="text-7xl lg:text-9xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent mb-4">
                  {domainCount}/1000
                </div>
                <div className="text-xl lg:text-2xl text-gray-700 font-semibold">
                  Premium Domains Registered
                </div>
              </div>
            </div>
            
            {domainCount < 1000 && (
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl shadow-lg">
                <Clock className="w-6 h-6 text-red-600" />
                <span className="text-lg lg:text-xl font-bold text-red-700">
                  Limited Time: Only {1000 - domainCount} domains left at $5!
                </span>
              </div>
            )}
          </div>

          {/* Enhanced status messages */}
          {!isConnected ? (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-3xl p-8 lg:p-12 max-w-2xl mx-auto text-center shadow-xl">
                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl mx-auto w-fit">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-blue-700">Connect Your Wallet</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Connect your Web3 wallet to claim your premium .pepu domain and join the decentralized future
                  </p>
                </div>
              </div>
            </div>
          ) : isLimitReached ? (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-3xl p-8 lg:p-12 max-w-2xl mx-auto text-center shadow-xl">
                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl shadow-xl mx-auto w-fit">
                    <AlertCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-red-700">All Domains Claimed!</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    All 1,000 premium .pepu domains have been registered. Stay tuned for future releases!
                  </p>
                </div>
              </div>
            </div>
          ) : hasOwnedDomain ? (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-3xl p-8 lg:p-12 max-w-2xl mx-auto text-center shadow-xl">
                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl mx-auto w-fit">
                    <Crown className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-green-700">Domain Owner</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    You already own a premium .pepu domain. Only one domain per wallet is allowed.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Enhanced info section */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-gray-500/10 to-slate-500/10 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-8 lg:p-12 max-w-5xl mx-auto shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                <div className="text-center space-y-4 group">
                  <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl shadow-xl mx-auto w-fit group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl lg:text-3xl font-black text-white">$5</span>
                  </div>
                  <h4 className="text-xl lg:text-2xl font-bold text-gray-800">Premium Price</h4>
                  <p className="text-gray-600 text-base lg:text-lg">Limited time discount for first 1,000 domains</p>
                </div>
                
                <div className="text-center space-y-4 group">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl shadow-xl mx-auto w-fit group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl lg:text-3xl font-black text-white">1</span>
                  </div>
                  <h4 className="text-xl lg:text-2xl font-bold text-gray-800">Per Wallet</h4>
                  <p className="text-gray-600 text-base lg:text-lg">One premium domain per wallet limit</p>
                </div>
                
                <div className="text-center space-y-4 group">
                  <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-xl mx-auto w-fit group-hover:scale-110 transition-transform duration-300">
                    <Crown className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <h4 className="text-xl lg:text-2xl font-bold text-gray-800">Unique Identity</h4>
                  <p className="text-gray-600 text-base lg:text-lg">All domain names are completely unique</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="relative z-10 border-t border-gray-200/60 mt-20 lg:mt-32 bg-white/40 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 py-12 lg:py-16 text-center">
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-3">
              <img src="/lovable-uploads/90659ea0-5d26-4342-9a87-0c004e40af4d.png" alt="Pepu" className="w-8 h-8 rounded-full" />
              <span className="text-xl font-bold text-gray-800">Pepu Name Service</span>
            </div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Built on Pepe Unchained V2 blockchain. Empowering the decentralized web with premium domain names.
            </p>
            <p className="text-sm text-gray-500">
              © 2025 Pepu Name Service. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
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

      {showDomainInfo && takenDomainInfo && (
        <DomainInfoModal
          domainInfo={takenDomainInfo}
          onClose={() => setShowDomainInfo(false)}
        />
      )}
    </div>
  );
};

export default Index;
