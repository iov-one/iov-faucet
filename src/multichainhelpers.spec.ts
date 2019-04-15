// tslint:disable:no-unused-expression
import { expect } from "chai";

import { Algorithm, PublicKeyBundle, PublicKeyBytes, TokenTicker } from "@iov/bcp";
import { Address } from "@iov/core";

import { availableTokensFromHolder } from "./multichainhelpers";

describe("multichainhelpers", () => {
  describe("availableTokensFromHolder", () => {
    const defaultPubkey: PublicKeyBundle = {
      algo: Algorithm.Ed25519,
      data: new Uint8Array([0, 1, 2, 3]) as PublicKeyBytes,
    };

    it("works for an empty account", () => {
      const tickers = availableTokensFromHolder({
        address: "aabbccdd" as Address,
        pubkey: defaultPubkey,
        balance: [],
      });
      expect(tickers).to.be.empty;
    });

    it("works for one token", () => {
      const tickers = availableTokensFromHolder({
        address: "aabbccdd" as Address,
        pubkey: defaultPubkey,
        balance: [
          {
            quantity: "1",
            fractionalDigits: 9,
            tokenTicker: "CASH" as TokenTicker,
          },
        ],
      });
      expect(tickers).to.eql(["CASH"]);
    });

    it("works for two tokens", () => {
      const tickers = availableTokensFromHolder({
        address: "aabbccdd" as Address,
        pubkey: defaultPubkey,
        balance: [
          {
            quantity: "1",
            fractionalDigits: 9,
            tokenTicker: "CASH" as TokenTicker,
          },
          {
            quantity: "1",
            fractionalDigits: 9,
            tokenTicker: "TRASH" as TokenTicker,
          },
        ],
      });
      expect(tickers).to.eql(["CASH", "TRASH"]);
    });
  });
});
