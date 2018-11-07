import { TokenTicker } from "@iov/core";

export const coinType: number = process.env.FAUCET_COIN_TYPE // truthy for string "0" (Bitcoin)
  ? Number.parseInt(process.env.FAUCET_COIN_TYPE, 10)
  : 1; // Value for Testnet (all coins), see SLIP-0044
export const instance: number = Number.parseInt(process.env.FAUCET_INSTANCE || "", 10) || 0;
export const concurrency: number = Number.parseInt(process.env.FAUCET_CONCURRENCY || "", 10) || 5;
export const port: number = Number.parseInt(process.env.FAUCET_PORT || "", 10) || 8000;
export const mnemonic: string | undefined = process.env.FAUCET_MNEMONIC;

export const creditAmountDefault = 10;
// defaults to creditAmountDefault if ticker is not listed
export const creditAmounts: Map<TokenTicker, number> = new Map([
  ["CASH" as TokenTicker, 20],
  ["LSK" as TokenTicker, 1],
]);
export const refillThreshold = 8; // refill when balance gets below `n` times credit amount
export const refillAmount = 20; // Send `n` times credit amount on refilling
