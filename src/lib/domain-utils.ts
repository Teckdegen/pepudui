// Banned words that users cannot register
export const BANNED_WORDS = [
  'pepeunchain', 'pepeunchaned', 'pepeunchanied', 'pepuunchianed', 'pepeunchiand', 
  'pepeeunchained', 'peepunchained', 'pepunchained', 'ppepeunchained', 'pepuunchaned', 
  'pepeunchainedairdrop', 'pepeunchained-airdrop', 'pepeunchainedfree', 'pepeunchained-mint', 
  'pepeunchainedmint', 'pepeunchained-mintnow', 'pepeunchainedclaim', 'pepeunchained-claim',
  'pepeunchainedpresale', 'pepeunchained-sale', 'pepeunchainedbuy', 'pepeuнchainedapp',
  'pepeunchainedlogin', 'pepeunchainedwallet', 'pepeunchainedportal', 'pepeunchainedsupport',
  'pepeunchained-support', 'pepeunchainedadmin', 'pepeunchained-team', 'pepeunchainedofficial',
  'pepeunchainedmod', 'officialpepeunchained', 'pepu-token', 'pepe-token', 'pepe-token-claim',
  'pepu-token-airdrop', 'realpepeunchained', 'realpepu', 'buy-pepeunchained', 'buy-pepu',
  'pepeunchained-nft', 'pepewallet', 'pepuwallet', 'рeрeunchаіned.com', 'ⲣeⲣeunchained',
  'pepeunÑhаіned', 'рepeunchаined', 'рeрeunchаіned', 'pepeunÑhained'
];

// Check if domain name contains banned words
export const hasBannedWords = (domainName: string): boolean => {
  const lowerDomain = domainName.toLowerCase();
  return BANNED_WORDS.some(banned => lowerDomain.includes(banned.toLowerCase()));
};

// Validate domain format (should be alphanumeric with hyphens, but not start/end with hyphen)
export const isValidDomainFormat = (domainName: string): boolean => {
  if (!domainName || domainName.length < 1 || domainName.length > 63) return false;
  
  // Should not start or end with hyphen
  if (domainName.startsWith('-') || domainName.endsWith('-')) return false;
  
  // Should only contain alphanumeric and hyphens
  const isValid = /^[a-zA-Z0-9-]+$/.test(domainName);
  
  return isValid;
};

// Auto-format domain (add .pepu if not present)
export const formatDomain = (input: string): string => {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.endsWith('.pepu')) {
    return trimmed;
  }
  return `${trimmed}.pepu`;
};

// Extract domain name without .pepu extension
export const extractDomainName = (fullDomain: string): string => {
  return fullDomain.replace('.pepu', '');
};

// Validate full domain (name + .pepu)
export const isValidFullDomain = (fullDomain: string): boolean => {
  if (!fullDomain.endsWith('.pepu')) return false;
  
  const domainName = extractDomainName(fullDomain);
  return isValidDomainFormat(domainName) && !hasBannedWords(domainName);
};