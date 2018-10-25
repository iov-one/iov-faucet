import fs from "fs";

import { UserProfile } from "@iov/keycontrol";

import { codecFromString } from "../codec";
import { generateRandomMnemonic } from "../crypto";
import { setSecretAndCreateIdentities, storeProfile } from "../profile";

export async function init(args: ReadonlyArray<string>): Promise<void> {
  if (args.length < 3) {
    throw Error(`Not enough arguments for action 'start'. See README for arguments`);
  }
  const filename = args[0];
  const password = args[1];
  const codec = codecFromString(args[2]);
  // optional args
  const userMnemonic: string | undefined = args[3];

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
