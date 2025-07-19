
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';

// Pepe Unchained V2 network configuration
export const pepeUnchainedV2 = {
  id: 97741,
  name: 'Pepe Unchained V2',
  network: 'pepe-unchained-v2',
  nativeCurrency: {
    decimals: 18,
    name: 'PEPU',
    symbol: 'PEPU',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-pepu-v2-mainnet-0.t.conduit.xyz'],
    },
    public: {
      http: ['https://rpc-pepu-v2-mainnet-0.t.conduit.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'PepuScan', url: 'https://pepuscan.com' },
  },
} as const;

// RainbowKit configuration with proper transports
export const config = getDefaultConfig({
  appName: 'Pepu Name Service',
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'your-project-id',
  chains: [pepeUnchainedV2 as any],
  transports: {
    [pepeUnchainedV2.id]: http(),
  },
  ssr: false,
});
