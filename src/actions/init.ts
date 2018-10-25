import fs from "fs";

import { UserProfile } from "@iov/keycontrol";

import { Codec } from "../codec";
import { generateRandomMnemonic } from "../crypto";
import { setSecretAndCreateIdentities, storeProfile } from "../profile";

export async function init(
  filename: string,
  password: string,
  codec: Codec,
  userMnemonic: string | undefined,
): Promise<void> {
  if (fs.existsSync(filename)) {
    throw Error("File already exists on disk, did you mean to -load- your profile?");
  }
  const profile = new UserProfile();

  let mnemonic: string;
  if (userMnemonic) {
    mnemonic = userMnemonic;
  } else {
    const newMnemonic = await generateRandomMnemonic();
    console.log("Faucet master passphrase: " + newMnemonic);
    mnemonic = newMnemonic;
  }

  await setSecretAndCreateIdentities(profile, mnemonic);
  await storeProfile(profile, filename, password);
}
