import { Ed25519HdWallet, Secp256k1HdWallet, Wallet } from "@iov/core";
import { Slip10RawIndex } from "@iov/crypto";

import { Codec } from "./codec";

/** See README for description of HD paths used */
export function faucetHdPath(
  purpose: number,
  cointType: number,
  instance: number,
  account: number,
): ReadonlyArray<Slip10RawIndex> {
  return [
    Slip10RawIndex.hardened(purpose),
    Slip10RawIndex.hardened(cointType),
    Slip10RawIndex.hardened(instance),
    Slip10RawIndex.hardened(account),
  ];
}

export function createWalletForCodec(input: Codec, mnemonic: string): Wallet {
  switch (input) {
    case Codec.Bns:
    case Codec.Lisk:
      return Ed25519HdWallet.fromMnemonic(mnemonic);
    case Codec.Ethereum:
      return Secp256k1HdWallet.fromMnemonic(mnemonic);
    default:
      throw new Error(`Codec '${input}' not supported`);
  }
}
