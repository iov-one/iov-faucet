import fs from "fs";

import { MultiChainSigner } from "@iov/core";

import { chainConnector, codecFromString } from "../codec";
import { refillFirstChain } from "../multichainhelpers";
import { loadProfile } from "../profile";

export async function refill(args: ReadonlyArray<string>): Promise<void> {
  if (args.length < 4) {
    throw Error(`Not enough arguments for action 'refill'. See README for arguments`);
  }
  const filename = args[0];
  const password = args[1];
  const codec = codecFromString(args[2]);
  const blockchainBaseUrl: string = args[3];

  if (!fs.existsSync(filename)) {
    throw Error("File does not exist on disk, did you mean to -init- your profile?");
  }
  const profile = await loadProfile(filename, password);
  const signer = new MultiChainSigner(profile);

  console.log("Connecting to blockchain ...");
  await signer.addChain(chainConnector(codec, blockchainBaseUrl));

  await refillFirstChain(signer);

  // shut down
  signer.chainIds().map(chainId => signer.connection(chainId).disconnect());
}
