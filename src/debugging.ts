import { BcpCoin } from "@iov/bcp-types";

/** A string representation of a coin in a human-readable format that can change at any time */
export function debugCoin(coin: BcpCoin): string {
  return `${coin.whole + coin.fractional / coin.sigFigs} ${coin.tokenTicker}`;
}

/** A string representation of a balance in a human-readable format that can change at any time */
export function debugBalance(data: ReadonlyArray<BcpCoin>): string {
  return `[${data.map(debugCoin).join(", ")}]`;
}
