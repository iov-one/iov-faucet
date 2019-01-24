import { ChainId } from "@iov/bcp-types";
import { Ed25519HdWallet, UserProfile } from "@iov/core";

import * as constants from "./constants";
import { faucetHdPath } from "./crypto";

export async function setSecretAndCreateIdentities(
  profile: UserProfile,
  mnemonic: string,
  chainId: ChainId,
): Promise<void> {
  if (profile.wallets.value.length !== 0) {
    throw new Error("Profile already contains wallets");
  }

  const wallet = profile.addWallet(Ed25519HdWallet.fromMnemonic(mnemonic));

  // first account is the token holder
  const numberOfIdentities = 1 + constants.concurrency;
  for (let i = 0; i < numberOfIdentities; i++) {
    const purpose = 1229936198; // big endian of ascii "IOVF"
    const coin = constants.coinType;
    const instance = constants.instance;

    console.log(`Creating identity m/${purpose}'/${coin}'/${instance}'/${i}' ...`);
    const path = faucetHdPath(purpose, coin, instance, i);
    await profile.createIdentity(wallet.id, chainId, path);
  }
}
