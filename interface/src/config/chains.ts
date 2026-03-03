/**
 * Centralized chain configuration for Xertra Swap
 * Single source of truth for all network-related constants
 */

// Chain IDs
export const CHAIN_IDS = {
  MAINNET: 105105,
  TESTNET: 205205, // Auroria testnet
} as const

export type SupportedChainId = typeof CHAIN_IDS[keyof typeof CHAIN_IDS]

// RPC URLs
export const RPC_URLS: Record<SupportedChainId, string> = {
  [CHAIN_IDS.MAINNET]: 'https://rpc.stratisevm.com',
  [CHAIN_IDS.TESTNET]: 'https://auroria.rpc.stratisevm.com',
}

// RPC URLs
export const BLOCK_EXPLORER_URLS: Record<SupportedChainId, string> = {
  [CHAIN_IDS.MAINNET]: 'https://explorer.xertra.com',
  [CHAIN_IDS.TESTNET]: 'https://auroria.explorer.xertra.com',
}


// Contract addresses per network
export interface NetworkContracts {
  WSTRAX: string
  FACTORY: string
  ROUTER: string
  ROUTER01: string
  INIT_HASH: string
  MULTICALL: string
}

export const NETWORK_CONTRACTS: Record<SupportedChainId, NetworkContracts> = {
  [CHAIN_IDS.MAINNET]: {
    WSTRAX: '0xeA705D2DbD8DE7Dc70Db7B531D0F620d9CeE9d18',
    FACTORY: '0xDC29A634611914ed73261A71C8F20D828cA2c09F',
    ROUTER: '0xE71d254C2F1430b597b53D83B3453d519F4C4564',
    ROUTER01: '0xB81CeAA5452408c29F88b2AdAfaA6B3078FBbE18',
    INIT_HASH: '0xa70eeb9bb3b548bd3404057cd53405c892d49801acca673e77238beb06b75b15',
    MULTICALL: '0x23D1682b48124F9cBDF8A3a4e937759F9BB86c61',
  },
  [CHAIN_IDS.TESTNET]: {
    WSTRAX: '0x6f39A32C3E7A54164e1C6E201979aec276B0Da8E',
    FACTORY: '0x23D1682b48124F9cBDF8A3a4e937759F9BB86c61',
    ROUTER: '0x9cD69163Ed694fD1E8c98e27A0944db1c6FABd4A',
    ROUTER01: '0xa7b5486F70Afc1a6a81cD62f602e921083B2Fa13',
    INIT_HASH: '0xa70eeb9bb3b548bd3404057cd53405c892d49801acca673e77238beb06b75b15',
    MULTICALL: '0x3037081943FcBDFf1771245F404C96681055A808',
  },
}

// Helper to get current network config from environment
export function getCurrentChainId(): SupportedChainId {
  const envChainId = process.env.REACT_APP_CHAIN_ID
  const chainId = envChainId ? parseInt(envChainId, 10) : CHAIN_IDS.MAINNET
  if (chainId !== CHAIN_IDS.MAINNET && chainId !== CHAIN_IDS.TESTNET) {
    console.warn(`Unknown chain ID ${chainId}, defaulting to mainnet`)
    return CHAIN_IDS.MAINNET
  }
  return chainId as SupportedChainId
}

export function getCurrentContracts(): NetworkContracts {
  return NETWORK_CONTRACTS[getCurrentChainId()]
}

export function getCurrentRpcUrl(): string {
  return RPC_URLS[getCurrentChainId()];
}

// Bad recipient addresses - contracts that should not receive tokens directly
export function getBadRecipientAddresses(): string[] {
  const contracts = getCurrentContracts()
  return [contracts.FACTORY, contracts.ROUTER01, contracts.ROUTER]
}

// Supported chain IDs for wallet connectors
export const SUPPORTED_CHAIN_IDS: SupportedChainId[] = [CHAIN_IDS.MAINNET, CHAIN_IDS.TESTNET]
