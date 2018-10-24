import leveldown from "leveldown";
import levelup from "levelup";

import { Ed25519HdWallet, HdPaths, UserProfile } from "@iov/core";

import { concurrency } from "./constants";

export async function setSecretAndCreateIdentities(profile: UserProfile, mnemonic: string): Promise<void> {
  if (profile.wallets.value.length !== 0) {
    throw new Error("Profile already contains wallets");
  }

  profile.addEntry(Ed25519HdWallet.fromMnemonic(mnemonic));

  const wallet = profile.wallets.value[0];
  for (let i = 0; i < concurrency; i++) {
    await profile.createIdentity(wallet.id, HdPaths.simpleAddress(i));
  }
}

export async function storeProfile(profile: UserProfile, filename: string, password: string): Promise<void> {
  const db = levelup(leveldown(filename));
  await profile.storeIn(db, password);
}
