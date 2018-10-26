import { Bip39, Random, Slip10RawIndex } from "@iov/crypto";

export async function generateRandomMnemonic(entropy: number = 16): Promise<string> {
  const randomBytes = await Random.getBytes(entropy);
  const mnemonic = Bip39.encode(randomBytes).asString();
  return mnemonic;
}

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
