import leveldown from "leveldown";
import levelup from "levelup";

import { bnsCodec } from "@iov/bns";
import { Ed25519HdWallet, HdPaths, UserProfile } from "@iov/core";
import { liskCodec } from "@iov/lisk";

import { Codec } from "./codec";
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
  } catch (e) {
    throw Error(e);
  } finally {
    await db.close();
  }
}

export function getAddresses(profile: UserProfile, codec: Codec): ReadonlyArray<string> {
  const wallet = profile.wallets.value[0];
  const identities = profile.getIdentities(wallet.id);
  switch (codec) {
    case Codec.Bns:
      return identities.map(identity => bnsCodec.keyToAddress(identity.pubkey));
    case Codec.Lisk:
      return identities.map(identity => liskCodec.keyToAddress(identity.pubkey));
  }
}
