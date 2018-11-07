import { Slip10RawIndex } from "@iov/crypto";

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
