import { TokenTicker } from "@iov/core";

export const concurrency: number = 20;
export const port: number = 8000;
export const creditAmounts: Map<TokenTicker, number> = new Map([["CASH" as TokenTicker, 1]]);
export const refillThreshold = 8; // refill when balance gets below `n` times credit amount
export const refillAmount = 20; // Send `n` times credit amount on refilling
