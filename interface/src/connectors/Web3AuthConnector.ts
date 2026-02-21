import { AbstractConnector } from '@web3-react/abstract-connector'
import type { ConnectorUpdate } from '@web3-react/types'
import { Web3Auth } from '@web3auth/modal'
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from '@web3auth/base'
import { CommonPrivateKeyProvider } from '@web3auth/base-provider'
import { Web3Provider } from '@ethersproject/providers'

const WEB3AUTH_CLIENT_ID = 'BMdNL0PvfLFjZ7xMac75rae_xRHywJxQWDCa1WXmjodl8kZK7-g4lTiafTdqU88w0Ww2tpahqBmpJOrLq1So--8'

interface Web3AuthConnectorOptions {
  chainId: number
  rpcUrl: string
}

// eslint-disable-next-line import/prefer-default-export
export class Web3AuthConnector extends AbstractConnector {
  private web3auth: Web3Auth | null = null

  private initialized = false

  private readonly chainId: number

  private readonly rpcUrl: string

  constructor({ chainId, rpcUrl }: Web3AuthConnectorOptions) {
    super({ supportedChainIds: [chainId] })
    this.chainId = chainId
    this.rpcUrl = rpcUrl
  }

  private async ensureInitialized(): Promise<Web3Auth> {
    if (this.web3auth && this.initialized) {
      return this.web3auth
    }

    const chainIdHex = `0x${this.chainId.toString(16)}`

    const chainConfig = {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      chainId: chainIdHex,
      rpcTarget: this.rpcUrl,
      displayName: 'Stratis EVM',
      ticker: 'STRAX',
      tickerName: 'Stratis',
      blockExplorerUrl: 'https://explorer.stratisevm.com',
    }

    const privateKeyProvider = new CommonPrivateKeyProvider({
      config: { chainConfig },
    })

    this.web3auth = new Web3Auth({
      clientId: WEB3AUTH_CLIENT_ID,
      web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
      chainConfig,
      privateKeyProvider,
    })

    await this.web3auth.initModal()
    this.initialized = true
    return this.web3auth
  }

  async activate(): Promise<ConnectorUpdate> {
    const web3auth = await this.ensureInitialized()

    // If not already connected, show the Web3Auth modal
    if (!web3auth.connected) {
      await web3auth.connect()
    }

    const provider = web3auth.provider
    if (!provider) {
      throw new Error('Web3Auth provider not available after connect')
    }

    const ethersProvider = new Web3Provider(provider as any)
    const signer = ethersProvider.getSigner()
    const account = await signer.getAddress()
    const network = await ethersProvider.getNetwork()

    // Listen for provider events
    provider.on('accountsChanged', this.handleAccountsChanged)
    provider.on('chainChanged', this.handleChainChanged)
    provider.on('disconnect', this.handleDisconnect)

    return {
      provider: provider as any,
      chainId: network.chainId,
      account,
    }
  }

  async getProvider(): Promise<any> {
    if (!this.web3auth) return undefined
    return this.web3auth.provider
  }

  async getChainId(): Promise<number> {
    if (!this.web3auth?.provider) return this.chainId
    const ethersProvider = new Web3Provider(this.web3auth.provider as any)
    const network = await ethersProvider.getNetwork()
    return network.chainId
  }

  async getAccount(): Promise<string | null> {
    if (!this.web3auth?.provider) return null
    const ethersProvider = new Web3Provider(this.web3auth.provider as any)
    const accounts = await ethersProvider.listAccounts()
    return accounts[0] || null
  }

  deactivate(): void {
    const provider = this.web3auth?.provider
    if (provider) {
      provider.removeListener('accountsChanged', this.handleAccountsChanged)
      provider.removeListener('chainChanged', this.handleChainChanged)
      provider.removeListener('disconnect', this.handleDisconnect)
    }

    if (this.web3auth?.connected) {
      // Fire-and-forget logout since deactivate is synchronous
      this.web3auth.logout().catch((err) => {
        console.error('Web3Auth logout error', err)
      })
    }
  }

  /**
   * Check if Web3Auth has a restorable session.
   * Init must be called first -- if the user had a previous session,
   * web3auth.connected will be true after initModal().
   */
  async isSessionAvailable(): Promise<boolean> {
    try {
      const web3auth = await this.ensureInitialized()
      return web3auth.connected
    } catch {
      return false
    }
  }

  private handleAccountsChanged = (accounts: string[]): void => {
    if (accounts.length === 0) {
      this.emitDeactivate()
    } else {
      this.emitUpdate({ account: accounts[0] })
    }
  }

  private handleChainChanged = (chainId: string | number): void => {
    this.emitUpdate({ chainId: Number(chainId) })
  }

  private handleDisconnect = (): void => {
    this.emitDeactivate()
  }
}
