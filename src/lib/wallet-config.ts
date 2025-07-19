
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

// Updated RainbowKit configuration with a working project ID
// You can get a free project ID from https://cloud.walletconnect.com/
export const config = getDefaultConfig({
  appName: 'Pepu Name Service',
  projectId: 'c4f79cc821944d9680842e34466bfbd9', // Using a sample project ID - replace with your own
  chains: [pepeUnchainedV2],
  transports: {
    [pepeUnchainedV2.id]: http(),
  },
  ssr: false,
});
