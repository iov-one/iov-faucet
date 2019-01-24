import { expect } from "chai";

import { TokenTicker } from "@iov/core";

import { creditAmount, refillAmount, refillThreshold } from "./cashflow";

describe("Cashflow", () => {
  describe("When fractional digits is not set", () => {
    describe("creditAmount", () => {
      it("returns '10' by default", () => {
        expect(creditAmount("TOKENZ" as TokenTicker)).to.eql({
          quantity: "10",
          fractionalDigits: 0,
          tokenTicker: "TOKENZ",
        });
        expect(creditAmount("TRASH" as TokenTicker)).to.eql({
          quantity: "10",
          fractionalDigits: 0,
          tokenTicker: "TRASH",
        });
      });

      it("returns value from env variable when set", () => {
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_CREDIT_AMOUNT_WTF = "22";
        expect(creditAmount("WTF" as TokenTicker)).to.eql({
          quantity: "22",
          fractionalDigits: 0,
          tokenTicker: "WTF",
        });
      });

      it("returns default from env variable set to empty", () => {
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_CREDIT_AMOUNT_WTF = "";
        expect(creditAmount("WTF" as TokenTicker)).to.eql({
          quantity: "10",
          fractionalDigits: 0,
          tokenTicker: "WTF",
        });
      });
    });

    describe("refillAmount", () => {
      it("returns 20*10 by default", () => {
        expect(refillAmount("TOKENZ" as TokenTicker)).to.eql({
          quantity: "200",
          fractionalDigits: 0,
          tokenTicker: "TOKENZ",
        });
      });

      it("returns 20*22 when credit amount is 22", () => {
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_CREDIT_AMOUNT_WTF = "22";
        expect(refillAmount("WTF" as TokenTicker)).to.eql({
          quantity: "440",
          fractionalDigits: 0,
          tokenTicker: "WTF",
        });
      });

      it("returns 30*10 when refill factor is 30", () => {
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_REFILL_FACTOR = "30";
        expect(refillAmount("TOKENZ" as TokenTicker)).to.eql({
          quantity: "300",
          fractionalDigits: 0,
          tokenTicker: "TOKENZ",
        });
      });

      it("returns 30*22 when refill factor is 30 and credit amount is 22", () => {
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_REFILL_FACTOR = "30";
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_CREDIT_AMOUNT_WTF = "22";
        expect(refillAmount("WTF" as TokenTicker)).to.eql({
          quantity: "660",
          fractionalDigits: 0,
          tokenTicker: "WTF",
        });
      });
    });

    describe("refillThreshold", () => {
      it("returns 8*10 by default", () => {
        expect(refillThreshold("TOKENZ" as TokenTicker)).to.eql({
          quantity: "80",
          fractionalDigits: 0,
          tokenTicker: "TOKENZ",
        });
      });

      it("returns 8*22 when credit amount is 22", () => {
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_CREDIT_AMOUNT_WTF = "22";
        expect(refillThreshold("WTF" as TokenTicker)).to.eql({
          quantity: "176",
          fractionalDigits: 0,
          tokenTicker: "WTF",
        });
      });

      it("returns 5*10 when refill threshold is 5", () => {
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_REFILL_THRESHOLD = "5";
        expect(refillThreshold("TOKENZ" as TokenTicker)).to.eql({
          quantity: "50",
          fractionalDigits: 0,
          tokenTicker: "TOKENZ",
        });
      });

      it("returns 5*22 when refill threshold is 5 and credit amount is 22", () => {
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_REFILL_THRESHOLD = "5";
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_CREDIT_AMOUNT_WTF = "22";
        expect(refillThreshold("WTF" as TokenTicker)).to.eql({
          quantity: "110",
          fractionalDigits: 0,
          tokenTicker: "WTF",
        });
      });
    });
  });

  describe("When fractional digits is set to 3", () => {
    before(() => {
      // tslint:disable-next-line:no-object-mutation
      process.env.FAUCET_FRACTIONAL_DIGITS = "3";
    });
    after(() => {
      // tslint:disable-next-line:no-object-mutation
      process.env.FAUCET_FRACTIONAL_DIGITS = "";
    });
    describe("creditAmount", () => {
      it("returns '10' + '000' by default", () => {
        expect(creditAmount("TOKENZ" as TokenTicker)).to.eql({
          quantity: "10000",
          fractionalDigits: 3,
          tokenTicker: "TOKENZ",
        });
        expect(creditAmount("TRASH" as TokenTicker)).to.eql({
          quantity: "10000",
          fractionalDigits: 3,
          tokenTicker: "TRASH",
        });
      });

      it("returns value from env variable + '000' when set", () => {
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_CREDIT_AMOUNT_WTF = "22";
        expect(creditAmount("WTF" as TokenTicker)).to.eql({
          quantity: "22000",
          fractionalDigits: 3,
          tokenTicker: "WTF",
        });
      });

      it("returns default from env variable + '000' when set to empty", () => {
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_CREDIT_AMOUNT_WTF = "";
        expect(creditAmount("WTF" as TokenTicker)).to.eql({
          quantity: "10000",
          fractionalDigits: 3,
          tokenTicker: "WTF",
        });
      });
    });

    describe("refillAmount", () => {
      beforeEach(() => {
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_REFILL_FACTOR = "";
      });
      it("returns 20*10 + '000' by default", () => {
        expect(refillAmount("TOKENZ" as TokenTicker)).to.eql({
          quantity: "200000",
          fractionalDigits: 3,
          tokenTicker: "TOKENZ",
        });
      });

      it("returns 20*22 + '000' when credit amount is 22", () => {
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_CREDIT_AMOUNT_WTF = "22";
        expect(refillAmount("WTF" as TokenTicker)).to.eql({
          quantity: "440000",
          fractionalDigits: 3,
          tokenTicker: "WTF",
        });
      });

      it("returns 30*10 + '000' when refill factor is 30", () => {
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_REFILL_FACTOR = "30";
        expect(refillAmount("TOKENZ" as TokenTicker)).to.eql({
          quantity: "300000",
          fractionalDigits: 3,
          tokenTicker: "TOKENZ",
        });
      });

      it("returns 30*22 + '000' when refill factor is 30 and credit amount is 22", () => {
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_REFILL_FACTOR = "30";
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_CREDIT_AMOUNT_WTF = "22";
        expect(refillAmount("WTF" as TokenTicker)).to.eql({
          quantity: "660000",
          fractionalDigits: 3,
          tokenTicker: "WTF",
        });
      });
    });

    describe("refillThreshold", () => {
      beforeEach(() => {
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_REFILL_THRESHOLD = "";
      });
      it("returns 8*10 + '000' by default", () => {
        expect(refillThreshold("TOKENZ" as TokenTicker)).to.eql({
          quantity: "80000",
          fractionalDigits: 3,
          tokenTicker: "TOKENZ",
        });
      });

      it("returns 8*22 + '000' when credit amount is 22", () => {
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_CREDIT_AMOUNT_WTF = "22";
        expect(refillThreshold("WTF" as TokenTicker)).to.eql({
          quantity: "176000",
          fractionalDigits: 3,
          tokenTicker: "WTF",
        });
      });

      it("returns 5*10 + '000' when refill threshold is 5", () => {
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_REFILL_THRESHOLD = "5";
        expect(refillThreshold("TOKENZ" as TokenTicker)).to.eql({
          quantity: "50000",
          fractionalDigits: 3,
          tokenTicker: "TOKENZ",
        });
      });

      it("returns 5*22 + '000' when refill threshold is 5 and credit amount is 22", () => {
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_REFILL_THRESHOLD = "5";
        // tslint:disable-next-line:no-object-mutation
        process.env.FAUCET_CREDIT_AMOUNT_WTF = "22";
        expect(refillThreshold("WTF" as TokenTicker)).to.eql({
          quantity: "110000",
          fractionalDigits: 3,
          tokenTicker: "WTF",
        });
      });
    });
  });
});
