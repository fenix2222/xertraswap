import JSBI from 'jsbi'

export type BigintIsh = JSBI | bigint | string

export enum ChainId {
  MAINNET = 105105,
  TESTNET = 205205
}

export enum TradeType {
  EXACT_INPUT = 0,
  EXACT_OUTPUT = 1
}

export enum Rounding {
  ROUND_DOWN = 0,
  ROUND_HALF_UP = 1,
  ROUND_UP = 2
}

export const FACTORY_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '0xDC29A634611914ed73261A71C8F20D828cA2c09F',
  [ChainId.TESTNET]: '0x23D1682b48124F9cBDF8A3a4e937759F9BB86c61'
}

export const INIT_CODE_HASH = '0xa70eeb9bb3b548bd3404057cd53405c892d49801acca673e77238beb06b75b15'

export const MINIMUM_LIQUIDITY = JSBI.BigInt(1000)

// exports for internal consumption
export const ZERO = JSBI.BigInt(0)
export const ONE = JSBI.BigInt(1)
export const TWO = JSBI.BigInt(2)
export const THREE = JSBI.BigInt(3)
export const FIVE = JSBI.BigInt(5)
export const TEN = JSBI.BigInt(10)
export const _100 = JSBI.BigInt(100)
export const _997 = JSBI.BigInt(997)
export const _1000 = JSBI.BigInt(1000)

export enum SolidityType {
  uint8 = 'uint8',
  uint256 = 'uint256'
}

export const SOLIDITY_TYPE_MAXIMA: { [key in SolidityType]: JSBI } = {
  [SolidityType.uint8]: JSBI.BigInt('0xff'),
  [SolidityType.uint256]: JSBI.BigInt(
    '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
  )
}
