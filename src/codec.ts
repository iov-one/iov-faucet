import { ChainConnector, TxCodec } from "@iov/bcp-types";
import { bnsCodec, bnsConnector } from "@iov/bns";
import { liskCodec, liskConnector } from "@iov/lisk";

export const enum Codec {
  Bns,
  Lisk,
}

export function codecFromString(input: string): Codec {
  switch (input) {
    case "bns":
      return Codec.Bns;
    case "lisk":
      return Codec.Lisk;
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
    default:
      throw new Error("No connector for this codec found");
  }
}

export function codecDefaultFractionalDigits(codec: Codec): number {
  switch (codec) {
    case Codec.Bns:
      return 9; // fixed for all weave tokens
    case Codec.Lisk:
      return 8; // only LSK supported
    default:
      throw new Error("Unknown codec");
  }
}
