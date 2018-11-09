import { expect } from "chai";

import { TokenTicker } from "@iov/core";

import { creditAmount, refillThreshold } from "./cashflow";

describe("Cashflow", () => {
  describe("creditAmount", () => {
    it("returns 10 by default", () => {
      expect(creditAmount("TOKENZ" as TokenTicker)).to.eql(10);
      expect(creditAmount("TRASH" as TokenTicker)).to.eql(10);
    });

    it("returns value from env variable when set", () => {
      // tslint:disable-next-line:no-object-mutation
      process.env.FAUCET_CREDIT_AMOUNT_WTF = "22";
      expect(creditAmount("WTF" as TokenTicker)).to.eql(22);
    });

    it("returns default from env variable set to empty", () => {
      // tslint:disable-next-line:no-object-mutation
      process.env.FAUCET_CREDIT_AMOUNT_WTF = "";
      expect(creditAmount("WTF" as TokenTicker)).to.eql(10);
    });
  });

  describe("refillThreshold", () => {
    it("returns 8*10 by default", () => {
      expect(refillThreshold("TOKENZ" as TokenTicker)).to.eql(80);
    });

    it("returns 8*22 when credit amount is 22", () => {
      // tslint:disable-next-line:no-object-mutation
      process.env.FAUCET_CREDIT_AMOUNT_WTF = "22";
      expect(refillThreshold("WTF" as TokenTicker)).to.eql(176);
    });

    it("returns 5*10 when refill threshold is 5", () => {
      // tslint:disable-next-line:no-object-mutation
      process.env.FAUCET_REFILL_THRESHOLD = "5";
      expect(refillThreshold("TOKENZ" as TokenTicker)).to.eql(50);
    });

    it("returns 5*22 when refill threshold is 5 and credit amount is 22", () => {
      // tslint:disable-next-line:no-object-mutation
      process.env.FAUCET_REFILL_THRESHOLD = "5";
      // tslint:disable-next-line:no-object-mutation
      process.env.FAUCET_CREDIT_AMOUNT_WTF = "22";
      expect(refillThreshold("WTF" as TokenTicker)).to.eql(110);
    });
  });
});
