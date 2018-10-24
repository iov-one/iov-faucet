import leveldown from "leveldown";
import levelup from "levelup";

import { Ed25519HdWallet, HdPaths, UserProfile } from "@iov/core";

import { concurrency } from "./constants";

export async function setSecretAndCreateIdentities(profile: UserProfile, mnemonic: string): Promise<void> {
  if (profile.wallets.value.length !== 0) {
    throw new Error("Profile already contains wallets");
  }

  const wallet = profile.addWallet(Ed25519HdWallet.fromMnemonic(mnemonic));

  for (let i = 0; i < concurrency; i++) {
    await profile.createIdentity(wallet.id, HdPaths.simpleAddress(i));
  }
}

export async function storeProfile(profile: UserProfile, filename: string, password: string): Promise<void> {
  const db = levelup(leveldown(filename));
  await profile.storeIn(db, password);
}

export async function loadProfile(filename: string, password: string): Promise<UserProfile> {
  const db = levelup(leveldown(filename));
  try {
    const profile = await UserProfile.loadFrom(db, password);
    console.log("Profile Loaded from disk");
    return profile;
  } finally {
    await db.close();
  }
}
