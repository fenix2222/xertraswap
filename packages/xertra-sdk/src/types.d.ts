declare module 'big.js' {
  export default class Big {
    static DP: number
    static RM: number
    constructor(value: string | number)
    div(value: string | number | Big): Big
    toFormat(dp?: number, format?: object): string
  }
}

declare module 'decimal.js-light' {
  export default class Decimal {
    static ROUND_DOWN: number
    static ROUND_HALF_UP: number
    static ROUND_UP: number
    static set(config: { precision?: number; rounding?: number }): void
    constructor(value: string | number)
    div(value: string | number | Decimal): Decimal
    toSignificantDigits(digits: number): Decimal
    decimalPlaces(): number
    toFormat(dp: number, format?: object): string
  }
}

declare module 'toformat' {
  export default function toFormat<T>(ctor: T): T
}
