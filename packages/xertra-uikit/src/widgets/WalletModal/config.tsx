import Metamask from "./icons/Metamask";
import MathWallet from "./icons/MathWallet";
import TokenPocket from "./icons/TokenPocket";
import TrustWallet from "./icons/TrustWallet";
import SafePalWallet from "./icons/SafePalWallet";
import Web3Auth from "./icons/Web3Auth";
import { Config, ConnectorNames } from "./types";

const connectors: Config[] = [
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
    title: "SafePal Wallet",
    icon: SafePalWallet,
    connectorId: ConnectorNames.Injected,
  },
];

export default connectors;
export const connectorLocalStorageKey = "connectorId";
