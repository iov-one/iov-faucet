import { Amount, ChainConnector, TokenTicker, TxCodec } from "@iov/bcp-types";
import { bnsCodec, bnsConnector } from "@iov/bns";
import { ethereumCodec, ethereumConnector } from "@iov/ethereum";
import { liskCodec, liskConnector } from "@iov/lisk";

export const enum Codec {
  Bns,
  Lisk,
  Ethereum,
}

export function codecFromString(input: string): Codec {
  switch (input) {
    case "bns":
      return Codec.Bns;
    case "lisk":
      return Codec.Lisk;
    case "ethereum":
      return Codec.Ethereum;
    default:
      throw new Error(`Codec '${input}' not supported`);
  }
}

export function codecImplementation(codec: Codec): TxCodec {
  switch (codec) {
    case Codec.Bns:
      return bnsCodec;
    case Codec.Lisk:
      return liskCodec;
    case Codec.Ethereum:
      return ethereumCodec;
    default:
      throw new Error("No codec imlementation for this codec found");
  }
}

export function chainConnector(codec: Codec, url: string): ChainConnector {
  switch (codec) {
    case Codec.Bns:
      return bnsConnector(url);
    case Codec.Lisk:
      return liskConnector(url);
    case Codec.Ethereum:
      return ethereumConnector(url, undefined);
    default:
      throw new Error("No connector for this codec found");
  }
}

export function codecDefaultFractionalDigits(codec: Codec): number {
  switch (codec) {
    case Codec.Bns:
      return 9; // fixed for all weave tokens
    case Codec.Lisk:
      return 8;
    case Codec.Ethereum:
      return 18;
    default:
      throw new Error("Unknown codec");
  }
}
