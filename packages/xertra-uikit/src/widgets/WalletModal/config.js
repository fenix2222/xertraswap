import Metamask from "./icons/Metamask";
import MathWallet from "./icons/MathWallet";
import TokenPocket from "./icons/TokenPocket";
import TrustWallet from "./icons/TrustWallet";
import WalletConnect from "./icons/WalletConnect";
import BinanceChain from "./icons/BinanceChain";
import SafePalWallet from "./icons/SafePalWallet";
import Web3Auth from "./icons/Web3Auth";
import { ConnectorNames } from "./types";
var connectors = [
    {
        title: "Web3Auth",
        icon: Web3Auth,
        connectorId: ConnectorNames.Web3Auth,
    },
    {
        title: "Metamask",
        icon: Metamask,
        connectorId: ConnectorNames.Injected,
    },
    {
        title: "TrustWallet",
        icon: TrustWallet,
        connectorId: ConnectorNames.Injected,
    },
    {
        title: "MathWallet",
        icon: MathWallet,
        connectorId: ConnectorNames.Injected,
    },
    {
        title: "TokenPocket",
        icon: TokenPocket,
        connectorId: ConnectorNames.Injected,
    },
    {
        title: "WalletConnect",
        icon: WalletConnect,
        connectorId: ConnectorNames.WalletConnect,
    },
    {
        title: "Binance Chain Wallet",
        icon: BinanceChain,
        connectorId: ConnectorNames.BSC,
    },
    {
        title: "SafePal Wallet",
        icon: SafePalWallet,
        connectorId: ConnectorNames.Injected,
    },
];
export default connectors;
export var connectorLocalStorageKey = "connectorId";
