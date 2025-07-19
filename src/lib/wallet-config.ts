import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http, createConfig } from 'wagmi';
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

// Fixed configuration using createConfig instead of getDefaultConfig
export const config = createConfig({
  chains: [pepeUnchainedV2],
  transports: {
    [pepeUnchainedV2.id]: http(),
  },
  ssr: false,
});
