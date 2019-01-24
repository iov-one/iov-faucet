import { BcpAccount, BcpCoin } from "@iov/bcp-types";
import { MultiChainSigner } from "@iov/core";

import { identityToAddress, SendJob } from "./multichainhelpers";

/** A string representation of a coin in a human-readable format that can change at any time */
export function debugCoin(coin: BcpCoin): string {
  return `${coin.quantity} ${coin.tokenTicker}`;
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
  if (accounts.length < 2) {
    throw new Error("List of accounts must contain at least one token holder and one distributor");
  }
  const holder = accounts[0];
  const distributors = accounts.slice(1);
  console.log("Holder:\n" + `  ${debugAccount(holder)}`);
  console.log("Distributors:\n" + distributors.map(r => `  ${debugAccount(r)}`).join("\n"));
}

export function logSendJob(signer: MultiChainSigner, job: SendJob): void {
  const from = identityToAddress(signer, job.sender);
  const to = job.recipient;
  console.log(`Sending ${job.amount} ${job.tokenTicker} from ${from} to ${to} ...`);
}
