import { ConnectorNames } from '@xertra/uikit'
import { Web3Provider } from '@ethersproject/providers'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { BscConnector } from '@binance-chain/bsc-connector'
import { NetworkConnector } from './NetworkConnector'
import { Web3AuthConnector } from './Web3AuthConnector'
import { getCurrentChainId, getCurrentRpcUrl, SUPPORTED_CHAIN_IDS, CHAIN_IDS } from '../config/chains'

const NETWORK_URL = getCurrentRpcUrl()

export const NETWORK_CHAIN_ID: number = getCurrentChainId()

export const network = new NetworkConnector({
  urls: { [NETWORK_CHAIN_ID]: NETWORK_URL },
})

let networkLibrary: Web3Provider | undefined
export function getNetworkLibrary(): Web3Provider {
  // eslint-disable-next-line no-return-assign
  return (networkLibrary = networkLibrary ?? new Web3Provider(network.provider as any))
}

export const injected = new InjectedConnector({
  supportedChainIds: SUPPORTED_CHAIN_IDS,
})

export const bscConnector = new BscConnector({ supportedChainIds: [CHAIN_IDS.MAINNET] })

export const walletconnect = new WalletConnectConnector({
  rpc: { [NETWORK_CHAIN_ID]: NETWORK_URL },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
})

export const web3authConnector = new Web3AuthConnector(NETWORK_CHAIN_ID);

export const connectorsByName: { [connectorName in ConnectorNames]: any } = {
  [ConnectorNames.Injected]: injected,
  [ConnectorNames.WalletConnect]: walletconnect,
  [ConnectorNames.BSC]: bscConnector,
  [ConnectorNames.Web3Auth]: web3authConnector,
}
