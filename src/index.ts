// #!/usr/bin/env node
// const path = require("path");
// // attempt to call in main file....
// const cli = require(path.join(__dirname, "..", "build", "cli.js"));
import fs from "fs";
import leveldown from "leveldown";
import levelup from "levelup";

import { bnsCodec } from "@iov/bns";
import { Bip39, Random } from "@iov/crypto";
import { Encoding } from "@iov/encoding";
import {
Ed25519HdWallet,
HdPaths,
UserProfile,
} from "@iov/keycontrol";

const args: ReadonlyArray<any> = process.argv.slice(2);

if (args.length !== 4) {
    throw Error("Requires four arguments, no more no less");
}

async function createPassphrase(entropy: number = 16): Promise<string> {
    const randomBytes = await Random.getBytes(entropy);
    const mnemonic: string = Bip39.encode(randomBytes).asString();
    return mnemonic;
}

async function addKeyAndIdentity(profile: UserProfile, mnemonic: string, codec: string): Promise<void> {
  try {
    profile.addEntry(Ed25519HdWallet.fromMnemonic(mnemonic));
    const wallet = profile.wallets.value[0];
    await profile.createIdentity(wallet.id, HdPaths.simpleAddress(0));
    const id1 = profile.getIdentities(wallet.id);
    const address = bnsCodec.keyToAddress(id1[0].pubkey);
    console.log("Your Public Key: " + Encoding.toHex(id1[0].pubkey.data));
    console.log("Your Address: " + address);
  } catch (e) {
    console.log(e);
    throw Error(e);
  }
}

async function storeProfile(profile: UserProfile, filename: string, password: string): Promise<void> {
    const db = levelup(leveldown(filename));
    await profile.storeIn(db, password);
}

function main(): void {

    const action = args[0];
    const filename = args[1];
    const password = args[2];
    const codec = args[3];

    if (codec !== "bns" && codec !== "lisk") {
        throw Error("Invalid codec. Valid codecs are: lisk, bns");
    }

    switch (action) {

        case "init":
        if (fs.existsSync(filename)) {
            throw Error("File already exists on disk, did you mean to -load- your profile?");
        }
        const profile = new UserProfile();
        createPassphrase().then((mnemonic) => {addKeyAndIdentity(profile, mnemonic, codec); });
        storeProfile(profile, filename, password);
        break;

        case "load":
        break;
    }
}

main();
