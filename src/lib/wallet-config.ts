
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { defineChain } from 'viem';
import {
  injectedWallet,
  rainbowWallet,
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  trustWallet,
  ledgerWallet,
  braveWallet,
  okxWallet,
  phantomWallet,
  safeWallet,
  zerionWallet,
  rabbyWallet,
  frameWallet,
  bitgetWallet,
  imTokenWallet,
  argentWallet,
  coreWallet,
  bitKeepWallet,
  tahoWallet,
  roninWallet,
  xdefiWallet,
  oneInchWallet,
  tokenPocketWallet,
  bybitWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';

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
  testnet: false,
});

// Define comprehensive wallet list
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        injectedWallet,
        metaMaskWallet,
        coinbaseWallet,
        walletConnectWallet,
        rainbowWallet,
      ],
    },
    {
      groupName: 'Popular',
      wallets: [
        trustWallet,
        braveWallet,
        okxWallet,
        phantomWallet,
        safeWallet,
        zerionWallet,
        rabbyWallet,
        frameWallet,
        bitgetWallet,
        imTokenWallet,
        argentWallet,
        coreWallet,
        bitKeepWallet,
        tahoWallet,
        roninWallet,
        xdefiWallet,
        oneInchWallet,
        tokenPocketWallet,
        bybitWallet,
      ],
    },
    {
      groupName: 'Hardware',
      wallets: [
        ledgerWallet,
      ],
    },
  ],
  {
    appName: 'Pepu Name Service',
    projectId: 'c4f79cc821944d9680842e34466bfbd9',
  }
);

// Enhanced configuration to show all available wallets
export const config = getDefaultConfig({
  appName: 'Pepu Name Service',
  projectId: 'c4f79cc821944d9680842e34466bfbd9',
  chains: [pepeUnchainedV2],
  transports: {
    [pepeUnchainedV2.id]: http('https://rpc-pepu-v2-mainnet-0.t.conduit.xyz'),
  },
  ssr: false,
  multiInjectedProviderDiscovery: true,
  connectors,
});
