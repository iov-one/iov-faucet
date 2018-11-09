import { expect } from "chai";

import { TokenTicker } from "@iov/core";

import { creditAmount } from "./cashflow";

describe("Cashflow", () => {
  describe("creditAmount", () => {
    it("returns 10 by default", () => {
      expect(creditAmount("TOKENZ" as TokenTicker)).to.eql(10);
      expect(creditAmount("TRASH" as TokenTicker)).to.eql(10);
    });
  });
});
