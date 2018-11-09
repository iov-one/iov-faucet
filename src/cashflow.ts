import { BcpAccount } from "@iov/bcp-types";
import { TokenTicker } from "@iov/core";
import { Int53 } from "@iov/encoding";

import * as constants from "./constants";

/** The amount of tokens that will be sent to the user */
export function creditAmount(token: TokenTicker): number {
  const amountFromEnv = process.env[`FAUCET_CREDIT_AMOUNT_${token}`];
  if (amountFromEnv) {
    return Int53.fromString(amountFromEnv).toNumber();
  } else {
    return 10;
  }
}

/** true iff the distributor account needs a refill */
export function needsRefill(account: BcpAccount, token: TokenTicker): boolean {
  const coin = account.balance.find(balance => balance.tokenTicker === token);

  const tokenBalance = coin ? coin.whole : 0; // truncates fractional

  return tokenBalance < creditAmount(token) * constants.refillThreshold;
}
