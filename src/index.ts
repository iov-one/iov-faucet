// #!/usr/bin/env node
// const path = require("path");
// // attempt to call in main file....
// const cli = require(path.join(__dirname, "..", "build", "cli.js"));
import fs from "fs";
import ip from "ip";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import leveldown from "leveldown";
import levelup from "levelup";

import { bnsCodec, bnsConnector } from "@iov/bns";
import { liskCodec, liskConnector } from "@iov/lisk";

import { RecipientId, SendTx, TokenTicker, TransactionKind } from "@iov/bcp-types";
import { ChainId, PublicKeyBundle  } from "@iov/tendermint-types";

import { MultiChainSigner } from "@iov/core";
import { Bip39, Random } from "@iov/crypto";
import { Ed25519HdWallet, HdPaths, UserProfile } from "@iov/keycontrol";

const args: ReadonlyArray<any> = process.argv.slice(2);
const concurrency: number = 20;
let profile; // Bad global var, I don't know what else to do...
let signer;

if (args.length < 4) {
    throw Error("Not enough arguments. See documentation on github for arguments");
}

async function createPassphrase(entropy: number = 16): Promise<string> {
    const randomBytes = await Random.getBytes(entropy);
    const mnemonic: string = Bip39.encode(randomBytes).asString();
    console.log("Faucet master passphrase: " + mnemonic);
    return mnemonic;
}

async function addKeyAndIdentity(mnemonic: string): Promise<void> {
  try {
    profile.addEntry(Ed25519HdWallet.fromMnemonic(mnemonic));
    await addIdentities();
  } catch (e) {
    throw Error(e);
  }
}

async function addIdentities(): Promise<void> {
  try {
    const wallet = profile.wallets.value[0];
    for (let i = 0; i < concurrency; i++) {
      await profile.createIdentity(wallet.id, HdPaths.simpleAddress(i));
    }
  } catch (e) {
    throw Error(e);
  }
}

function getAddresses(codec: string): ReadonlyArray<string> {
  let addresses;
  try {
    const wallet = profile.wallets.value[0];
    const id1 = profile.getIdentities(wallet.id);
    switch (codec) {
      case "bns":
      addresses = id1.map((count) => bnsCodec.keyToAddress(count.pubkey));
      break;
      case "lisk":
      addresses = id1.map((count) => liskCodec.keyToAddress(count.pubkey));
      break;
    }
    console.log("Got addresses: " + addresses);
  } catch (e) {
    throw Error(e);
  }
  return addresses;
}

async function storeProfile(filename: string, password: string): Promise<void> {
    const db = levelup(leveldown(filename));
    await profile.storeIn(db, password);
}

async function loadProfile(filename: string, password: string): Promise<void> {
  const db = levelup(leveldown(filename));
  try {
      profile = await UserProfile.loadFrom(db, password);
      console.log("Profile Loaded from disk");
      await addIdentities();
      signer = new MultiChainSigner(profile);
      await signer.addChain(bnsConnector("wss://bov.friendnet-fast.iov.one"));
      await signer.addChain(bnsConnector("wss://bov.friendnet-slow.iov.one"));
      await signer.addChain(liskConnector("https://testnet.lisk.io"));
      console.log("Connected to networks: " + signer.chainIds());
      console.log("Ready to go!");
  } catch (e) {
    throw Error(e);
  } finally {
    await db.close();
  }
}

async function sendTransaction(address: string, chainId: string, ticker: string): Promise<SendTx> {
  const wallet = profile.wallets.value[0];
  const mainIdentity = profile.getIdentities(wallet.id)[Math.floor(Math.random() * Math.floor(20))];

  // TODO: Add validation of address for requested chain

  console.log("Address: ", signer.keyToAddress(chainId, mainIdentity.pubkey));
  const sendTx: SendTx = {
    kind: TransactionKind.Send,
    chainId: chainId as ChainId,
    signer: mainIdentity.pubkey as PublicKeyBundle,
    recipient: address as RecipientId,
    memo: "We ❤️ developers – iov.one",
    amount: {
      whole: 1,
      fractional: 44550000,
      tokenTicker: ticker as TokenTicker,
    },
  };
  try {
    await signer.signAndCommit(sendTx, wallet.id);
  } catch (e) {
    console.log(e);
  }
  return sendTx;
}

function main(): void {

    const action = args[0];
    const filename = args[1];
    const password = args[2];
    const codec = args[3];
    const userMnemonic = args[4];

    if (codec !== "bns" && codec !== "lisk") {
        throw Error("Invalid codec. Valid codecs are: lisk, bns");
    }

    switch (action) {

        case "init":
        if (fs.existsSync(filename)) {
            throw Error("File already exists on disk, did you mean to -load- your profile?");
        }
        profile = new UserProfile();
        createPassphrase().then((mnemonic) => {addKeyAndIdentity(userMnemonic ? userMnemonic : mnemonic); });
        storeProfile(filename, password);
        break;

        case "start":
        if (!fs.existsSync(filename)) {
          throw Error("File does not exist on disk, did you mean to -init- your profile?");
        }
        loadProfile(filename, password);
        break;
    }

    const api = new Koa();
    api.use(bodyParser());

    api.use(async (context) => {
      switch (context.path) {
        case "/state":
          // tslint:disable-next-line:no-object-mutation
          context.response.body = {
            status: "ok",
            nodeUrl: ip.address(),
            chainId: signer.chainIds(),
            bnsAddresses: getAddresses("bns"),
            liskAddresses: getAddresses("lisk"),
          };
          break;
        case "/getTokens":
          if (!context.request.body) {
            // tslint:disable-next-line:no-object-mutation
            context.response.body = "Post not get :)";
            break;
          }

          const {ticker, chainId, address} = context.request.body;
          if (address) {
            console.log("Got address: " + address);
          } else {
            // tslint:disable-next-line:no-object-mutation
            context.response.body = "Empty address";
          }

          if (chainId) {
            console.log("Got chainId: " + chainId);
          } else {
            // tslint:disable-next-line:no-object-mutation
            context.response.body = "Empty chainId";
          }

          if (ticker) {
            console.log("Got ticker: " + ticker);
            const tickers = await signer.connection(chainId).getAllTickers();
            const networkTickers = tickers.data.map((token) => token.tokenTicker);
            if (networkTickers.indexOf(ticker) === -1) {
              // tslint:disable-next-line:no-object-mutation
              context.response.body = "Invalid Ticker. Valid tickers are: " + JSON.stringify(networkTickers);
              break;
            }
          } else {
            // tslint:disable-next-line:no-object-mutation
            context.response.body = "Empty chainId";
          }

          let sendTx;
          try {
            sendTx = await sendTransaction(address, chainId, ticker);
          } catch (e) {
            console.log(e);
            // tslint:disable-next-line:no-object-mutation
            context.response.body = "Send failed";
            break;
          }

          // tslint:disable-next-line:no-object-mutation
          context.response.body = "Would have sent " + JSON.stringify(sendTx);
          break;
        default:
        // koa sends 404 by default
      }
    });
    api.listen(8000);
    console.log("Started Koa Listener");

}

main();
