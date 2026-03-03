import { FC } from "react";
import { SvgProps } from "../../components/Svg/types";

export enum ConnectorNames {
  Injected = "injected",
  WalletConnect = "walletconnect",
  BSC = "bsc",
  Web3Auth = "web3auth",
}

export type Login = () => void;

export interface Config {
  title: string;
  icon: FC<SvgProps>;
  connectorId: ConnectorNames;
}
