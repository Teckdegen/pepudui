
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { defineChain } from 'viem';

// Define Pepe Unchained V2 network configuration
export const pepeUnchainedV2 = defineChain({
  id: 97741,
  name: 'Pepe Unchained V2',
  nativeCurrency: {
    decimals: 18,
    name: 'PEPU',
    symbol: 'PEPU',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-pepu-v2-mainnet-0.t.conduit.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'PepuScan', url: 'https://pepuscan.com' },
  },
});

// Simplified RainbowKit configuration
export const config = getDefaultConfig({
  appName: 'Pepu Name Service',
  projectId: 'your-project-id',
  chains: [pepeUnchainedV2],
  transports: {
    [pepeUnchainedV2.id]: http(),
  },
  ssr: false,
});
