// Simplified wallet configuration to avoid TypeScript compiler errors
export const pepeUnchainedV2 = {
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
  testnet: false,
};

// Simplified config without complex wagmi types
export const config = {
  appName: 'Pepu Name Service',
  projectId: 'c4f79cc821944d9680842e34466bfbd9',
  chains: [pepeUnchainedV2],
};