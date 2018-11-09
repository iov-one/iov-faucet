import { expect } from "chai";

import { TokenTicker } from "@iov/core";

import { creditAmount } from "./cashflow";

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
});
