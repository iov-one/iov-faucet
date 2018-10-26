import { TxCodec } from "@iov/bcp-types";
import { bnsCodec } from "@iov/bns";
import { liskCodec } from "@iov/lisk";

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
