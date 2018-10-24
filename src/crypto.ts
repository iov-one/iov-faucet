import { Bip39, Random } from "@iov/crypto";

export async function generateRandomMnemonic(entropy: number = 16): Promise<string> {
  const randomBytes = await Random.getBytes(entropy);
  const mnemonic = Bip39.encode(randomBytes).asString();
  return mnemonic;
}
