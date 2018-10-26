import leveldown from "leveldown";
import levelup from "levelup";

import { Ed25519HdWallet, HdPaths, UserProfile } from "@iov/core";
import { LocalIdentity } from "@iov/keycontrol";

import * as constants from "./constants";

export async function setSecretAndCreateIdentities(profile: UserProfile, mnemonic: string): Promise<void> {
  if (profile.wallets.value.length !== 0) {
    throw new Error("Profile already contains wallets");
  }

  const wallet = profile.addWallet(Ed25519HdWallet.fromMnemonic(mnemonic));

  // first account is the token holder
  const numberOfIdentities = 1 + constants.concurrency;
  for (let i = 0; i < numberOfIdentities; i++) {
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

export function holderIdentity(profile: UserProfile): LocalIdentity {
  const wallet = profile.wallets.value[0];
  return profile.getIdentities(wallet.id)[0];
}

export function distributorIdentities(profile: UserProfile): ReadonlyArray<LocalIdentity> {
  const wallet = profile.wallets.value[0];
  return profile.getIdentities(wallet.id).slice(1);
}
