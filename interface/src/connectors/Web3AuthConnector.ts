import { AbstractConnector } from '@web3-react/abstract-connector'
import type { ConnectorUpdate } from '@web3-react/types'
import { Web3Auth } from '@web3auth/modal'
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from '@web3auth/base'
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider'
import { getDefaultExternalAdapters } from '@web3auth/default-evm-adapter'
import { BLOCK_EXPLORER_URLS, RPC_URLS } from '../config/chains'

interface Eip1193ProviderLike {
  request?: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>
  chainId?: string | number
  selectedAddress?: string
  on?: (event: string, listener: (...args: unknown[]) => void) => void
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void
}

function resolveWeb3AuthNetwork(): (typeof WEB3AUTH_NETWORK)[keyof typeof WEB3AUTH_NETWORK] {
  const env = process.env.REACT_APP_WEB3AUTH_NETWORK?.toLowerCase();
  if (env === 'sapphire_devnet') 
    return WEB3AUTH_NETWORK.SAPPHIRE_DEVNET;
  return WEB3AUTH_NETWORK.SAPPHIRE_MAINNET;
}

// eslint-disable-next-line import/prefer-default-export
export class Web3AuthConnector extends AbstractConnector {
  private web3auth: Web3Auth | null = null

  private initialized = false

  private readonly chainId: number

  constructor(chainId: number) {
    super({ supportedChainIds: [chainId] })
    this.chainId = chainId;
  }

  private async ensureInitialized(): Promise<Web3Auth> {

    if (this.web3auth && this.initialized) {
      return this.web3auth
    }

    const chainIdHex = `0x${this.chainId.toString(16)}`

    const chainConfig = {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      chainId: chainIdHex,
      rpcTarget: RPC_URLS[this.chainId],
      displayName: 'Stratis EVM',
      ticker: 'STRAX',
      tickerName: 'Stratis',
      decimals: 18,
      blockExplorerUrl: BLOCK_EXPLORER_URLS[this.chainId],
    }

    const privateKeyProvider = new EthereumPrivateKeyProvider({
      config: { chainConfig },
    })

    const clientId = process.env.REACT_APP_WEB3AUTH_CLIENT_ID!;
    const clientNetwork =  resolveWeb3AuthNetwork();
    console.log(clientId, clientNetwork);  

    this.web3auth = new Web3Auth({
      clientId,
      web3AuthNetwork: clientNetwork,
      chainConfig,
      privateKeyProvider,
      uiConfig: {
        appName: 'Xertra Swap',
        theme: { primary: '#38023b' },
        mode: 'dark',
        logoDark: 'https://stratispherestaging.blob.core.windows.net/images/Xertra_Logo_White_Transparent.png',
        logoLight: 'https://stratispherestaging.blob.core.windows.net/images/Xertra_Logo_Transparent.png',
        defaultLanguage: 'en',
        loginGridCol: 3,
        primaryButton: 'externalLogin',
      },
    });

    try {
      const adapters = getDefaultExternalAdapters({ options: this.web3auth.options })
      adapters.forEach((adapter) => this.web3auth!.configureAdapter(adapter))
    } catch (err) {
      console.warn('Failed to configure external wallet adapters:', err)
    }    

    await this.web3auth.initModal()
    this.initialized = true
    return this.web3auth
  }

  async activate(): Promise<ConnectorUpdate> {
    const web3auth = await this.ensureInitialized();

    const provider = await this.waitForProvider(web3auth)
    const account = await this.waitForAccount(provider)
    if (!account) {
      throw new Error('Web3Auth account not available after connect')
    }

    const chainIdValue = (await this.request(provider, 'eth_chainId')) ?? provider.chainId
    const chainId = this.parseChainId(chainIdValue)

    // Listen for provider events
    if (provider.on) {
      provider.on('accountsChanged', this.handleAccountsChanged as unknown as (...args: unknown[]) => void)
      provider.on('chainChanged', this.handleChainChanged as unknown as (...args: unknown[]) => void)
      provider.on('disconnect', this.handleDisconnect as unknown as (...args: unknown[]) => void)
    }
    return {
      provider,
      chainId,
      account,
    }
  }

  async getProvider(): Promise<Eip1193ProviderLike | undefined> {
    if (!this.web3auth) return undefined
    return this.web3auth.provider as Eip1193ProviderLike
  }

  async getChainId(): Promise<number> {
    const provider = this.web3auth?.provider as Eip1193ProviderLike | null
    if (!provider) return this.chainId
    const chainIdValue = (await this.request(provider, 'eth_chainId')) ?? provider.chainId
    return this.parseChainId(chainIdValue)
  }

  async getAccount(): Promise<string | null> {
    const provider = this.web3auth?.provider as Eip1193ProviderLike | null
    if (!provider) return null
    return this.resolveAccount(provider);
  }

  deactivate(): void {
    const provider = this.web3auth?.provider as Eip1193ProviderLike | null
    if (provider) {
      provider.removeListener?.('accountsChanged', this.handleAccountsChanged as unknown as (...args: unknown[]) => void)
      provider.removeListener?.('chainChanged', this.handleChainChanged as unknown as (...args: unknown[]) => void)
      provider.removeListener?.('disconnect', this.handleDisconnect as unknown as (...args: unknown[]) => void)
    }

    if (this.web3auth?.connected) {
      // Fire-and-forget logout since deactivate is synchronous
      this.web3auth.logout().catch((err) => {
        console.error('Web3Auth logout error', err)
      })
    }
  }

  async isSessionAvailable(): Promise<boolean> {
    try {
      const web3auth = await this.ensureInitialized()
      return web3auth.connected
    } catch {
      return false
    }
  }

  private handleAccountsChanged = (accounts: unknown): void => {
    if (!Array.isArray(accounts) || accounts.length === 0) {
      this.emitDeactivate()
    } else {
      this.emitUpdate({ account: String(accounts[0]) })
    }
  }

  private handleChainChanged = (chainId: unknown): void => {
    this.emitUpdate({ chainId: this.parseChainId(chainId) })
  }

  private handleDisconnect = (): void => {
    this.emitDeactivate()
  }

  private async request(provider: Eip1193ProviderLike, method: string): Promise<unknown> {
    if (!provider.request) {
      return null
    }

    try {
      return await provider.request({ method })
    } catch {
      return null
    }
  }

  private async resolveAccount(provider: Eip1193ProviderLike, requestAccess = true): Promise<string | null> {
    // Web3Auth v9 provider only supports eth_accounts — eth_coinbase and
    // eth_requestAccounts are not available on the private key provider.    
    const accounts = await this.request(provider, 'eth_accounts')
    if (Array.isArray(accounts) && accounts[0]) {
      return String(accounts[0])
    }

    if (provider.selectedAddress) {
      return provider.selectedAddress
    }   

    return null;
  }

  private async waitForAccount(provider: Eip1193ProviderLike): Promise<string | null> {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const account = await this.resolveAccount(provider);
      if (account) {
        return account
      }

      // Give the OpenLogin provider a moment to finish propagating account state.
      await new Promise((resolve) => {
        setTimeout(resolve, 250)
      })
    }

    return null
  }

  private async waitForProvider(web3auth: Web3Auth): Promise<Eip1193ProviderLike> {
    // In v9, web3auth.provider is always set after initModal() (from privateKeyProvider),
    // so we must check web3auth.connected to know if there's an actual session.

    if (web3auth.connected && web3auth.provider) {
      return web3auth.provider as Eip1193ProviderLike
    }

    const connectedProvider = (await web3auth.connect()) as Eip1193ProviderLike | null
    if (connectedProvider) {
      return connectedProvider;
    }

    for (let attempt = 0; attempt < 40; attempt += 1) {
      const delayedProvider = web3auth.provider as Eip1193ProviderLike | null
      if (delayedProvider) {
        return delayedProvider
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 250)
      })
    }

    throw new Error('Web3Auth provider not available after connect')
  }

  private parseChainId(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string') {
      if (value.startsWith('0x')) {
        const parsedHex = Number.parseInt(value, 16)
        if (Number.isFinite(parsedHex)) {
          return parsedHex
        }
      }

      const parsedDecimal = Number(value)
      if (Number.isFinite(parsedDecimal)) {
        return parsedDecimal
      }
    }

    return this.chainId
  }
}
