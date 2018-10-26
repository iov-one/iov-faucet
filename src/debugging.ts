import { BcpAccount, BcpCoin } from "@iov/bcp-types";

/** A string representation of a coin in a human-readable format that can change at any time */
export function debugCoin(coin: BcpCoin): string {
  return `${coin.whole + coin.fractional / coin.sigFigs} ${coin.tokenTicker}`;
}

/** A string representation of a balance in a human-readable format that can change at any time */
export function debugBalance(data: ReadonlyArray<BcpCoin>): string {
  return `[${data.map(debugCoin).join(", ")}]`;
}

/** A string representation of an account in a human-readable format that can change at any time */
export function debugAccount(account: BcpAccount): string {
  return `${account.address}: ${debugBalance(account.balance)}`;
}

export function logAccountsState(accounts: ReadonlyArray<BcpAccount>): void {
  const holder = accounts[0];
  const distributors = accounts.slice(1);
  console.log("Holder:\n" + `  ${debugAccount(holder)}`);
  console.log("Distributors:\n" + distributors.map(r => `  ${debugAccount(r)}`).join("\n"));
}
