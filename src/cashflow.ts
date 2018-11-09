import { BcpAccount } from "@iov/bcp-types";
import { TokenTicker } from "@iov/core";
import { Int53 } from "@iov/encoding";

/** refill when balance gets below `factor` times credit amount */
const defaultRefillThresholdFactor = 8;

/** The amount of tokens that will be sent to the user */
export function creditAmount(token: TokenTicker): number {
  const amountFromEnv = process.env[`FAUCET_CREDIT_AMOUNT_${token}`];
  if (amountFromEnv) {
    return Int53.fromString(amountFromEnv).toNumber();
  } else {
    return 10;
  }
}

export function refillThreshold(token: TokenTicker): number {
  const factorFromEnv = Number.parseInt(process.env.FAUCET_REFILL_THRESHOLD || "", 10) || undefined;
  const factor = factorFromEnv || defaultRefillThresholdFactor;
  return creditAmount(token) * factor;
}

/** true iff the distributor account needs a refill */
export function needsRefill(account: BcpAccount, token: TokenTicker): boolean {
  const coin = account.balance.find(balance => balance.tokenTicker === token);

  const tokenBalance = coin ? coin.whole : 0; // truncates fractional

  return tokenBalance < refillThreshold(token);
}
