import { ChainId } from "@iov/bcp";
import { UserProfile } from "@iov/core";

import { Codec } from "./codec";
import * as constants from "./constants";
import { faucetHdPath, walletFromCodec } from "./crypto";

export async function setSecretAndCreateIdentities(
  profile: UserProfile,
  mnemonic: string,
  chainId: ChainId,
  blockchain: Codec,
): Promise<void> {
  if (profile.wallets.value.length !== 0) {
    throw new Error("Profile already contains wallets");
  }
  const wallet = walletFromCodec(blockchain, mnemonic);
  const walletInfo = profile.addWallet(wallet);

  // first account is the token holder
  const numberOfIdentities = 1 + constants.concurrency;
  for (let i = 0; i < numberOfIdentities; i++) {
    const purpose = 1229936198; // big endian of ascii "IOVF"
    const coin = constants.coinType;
    const instance = constants.instance;

    console.log(`Creating identity m/${purpose}'/${coin}'/${instance}'/${i}' ...`);
    const path = faucetHdPath(purpose, coin, instance, i);
    await profile.createIdentity(walletInfo.id, chainId, path);
  }
}
