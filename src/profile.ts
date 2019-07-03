import { ChainId } from "@iov/bcp";
import { UserProfile } from "@iov/keycontrol";

import { Codec, codecImplementation } from "./codec";
import * as constants from "./constants";
import { createWalletForCodec, faucetHdPath } from "./crypto";

export async function setSecretAndCreateIdentities(
  profile: UserProfile,
  mnemonic: string,
  chainId: ChainId,
  codecName: Codec,
): Promise<void> {
  if (profile.wallets.value.length !== 0) {
    throw new Error("Profile already contains wallets");
  }
  const wallet = profile.addWallet(createWalletForCodec(codecName, mnemonic));

  // first account is the token holder
  const numberOfIdentities = 1 + constants.concurrency;
  for (let i = 0; i < numberOfIdentities; i++) {
    // create
    const purpose = 1229936198; // big endian of ascii "IOVF"
    const coin = constants.coinType;
    const instance = constants.instance;
    const path = faucetHdPath(purpose, coin, instance, i);
    const identity = await profile.createIdentity(wallet.id, chainId, path);

    // log
    const role = i === 0 ? "token holder " : `distributor ${i}`;
    const address = codecImplementation(codecName).identityToAddress(identity);
    console.log(`Created ${role} (m/${purpose}'/${coin}'/${instance}'/${i}'): ${address}`);
  }
}
