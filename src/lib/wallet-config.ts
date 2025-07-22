import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { defineChain } from 'viem';
import {
  injectedWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';

// Define Pepe Unchained V2 network configuration
export const pepeUnchainedV2 = defineChain({
  id: 11155111,
  name: 'Pepe Unchained V2',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://eth-sepolia.public.blastapi.io'],
    },
    public: {
      http: ['https://eth-sepolia.public.blastapi.io'],
    },
  },
  blockExplorers: {
    default: { name: 'PepuScan', url: 'https://sepolia.etherscan.io' },
  },
  testnet: false,
});

// Show only wallets installed or detected in browser, plus WalletConnect for QR mobile support
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Installed Wallets',
      wallets: [injectedWallet],
    },
    {
      groupName: 'Mobile',
      wallets: [walletConnectWallet],
    },
  ],
  {
    appName: 'Pepu Name Service',
    projectId: 'c4f79cc821944d9680842e34466bfbd9',
    // Enable chain switching for all wallets
    enableChainSwitching: true,
  }
);

// Enhanced configuration to show only installed wallets
export const config = getDefaultConfig({
  appName: 'Pepu Name Service',
  projectId: 'c4f79cc821944d9680842e34466bfbd9',
  chains: [pepeUnchainedV2],
  transports: {
    [pepeUnchainedV2.id]: http('https://eth-sepolia.public.blastapi.io'),
  },
  ssr: false,
  multiInjectedProviderDiscovery: true, // Detect all installed/injected wallets
  connectors,
});
