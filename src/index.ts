import fs from "fs";
import ip from "ip";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import leveldown from "leveldown";
import levelup from "levelup";

import { bnsCodec, bnsConnector } from "@iov/bns";
import { liskCodec, liskConnector } from "@iov/lisk";

import { RecipientId, SendTx, TokenTicker, TransactionKind } from "@iov/bcp-types";
import { ChainId, PublicKeyBundle } from "@iov/tendermint-types";

import { MultiChainSigner } from "@iov/core";
import { Bip39, Random } from "@iov/crypto";
import { Ed25519HdWallet, HdPaths, UserProfile } from "@iov/keycontrol";

const concurrency: number = 20;
let profile; // Bad global var, I don't know what else to do...
let signer;

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
        addresses = id1.map(count => bnsCodec.keyToAddress(count.pubkey));
        break;
      case "lisk":
        addresses = id1.map(count => liskCodec.keyToAddress(count.pubkey));
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

async function initialize(
  filename: string,
  password: string,
  userMnemonic: string | undefined,
): Promise<void> {
  if (fs.existsSync(filename)) {
    throw Error("File already exists on disk, did you mean to -load- your profile?");
  }
  profile = new UserProfile();
  const mnemonic = await createPassphrase();
  await addKeyAndIdentity(userMnemonic ? userMnemonic : mnemonic);
  await storeProfile(filename, password);
}

async function start(filename: string, password: string): Promise<void> {
  if (!fs.existsSync(filename)) {
    throw Error("File does not exist on disk, did you mean to -initialize- your profile?");
  }
  await loadProfile(filename, password);

  const api = new Koa();
  api.use(bodyParser());

  api.use(async context => {
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
        // TODO: Allow requests using GET + query params
        if (context.request.method === "GET") {
          // tslint:disable-next-line:no-object-mutation
          context.response.body =
            "This endpoint requires a POST request, with fields: address, chainId and ticker.";
          break;
        }

        // TODO: Better error handling on request body being empty?
        const { ticker, chainId, address } = context.request.body;
        if (address) {
          console.log("Got address: " + address);
        } else {
          // tslint:disable-next-line:no-object-mutation
          context.response.body = "Empty address.";
          break;
        }

        if (signer.chainIds().indexOf(chainId) === -1) {
          // tslint:disable-next-line:no-object-mutation
          context.response.body = "Empty or invalid chainId. Valid chainIds are: " + signer.chainIds();
          break;
        }

        if (ticker) {
          console.log("Got ticker: " + ticker);
          const tickers = await signer.connection(chainId).getAllTickers();
          const networkTickers = tickers.data.map(token => token.tokenTicker);
          if (networkTickers.indexOf(ticker) === -1) {
            // tslint:disable-next-line:no-object-mutation
            context.response.body = "Invalid Ticker. Valid tickers are: " + JSON.stringify(networkTickers);
            break;
          }
        } else {
          // tslint:disable-next-line:no-object-mutation
          context.response.body = "Empty chainId";
          break;
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

function main(args: ReadonlyArray<string>): void {
  if (args.length < 4) {
    throw Error("Not enough arguments. See documentation on github for arguments");
  }

  const action = args[0];
  const filename = args[1];
  const password = args[2];
  const codec = args[3];
  const userMnemonic: string | undefined = args[4];

  if (codec !== "bns" && codec !== "lisk") {
    throw Error("Invalid codec. Valid codecs are: lisk, bns");
  }

  switch (action) {
    case "initialize":
      initialize(filename, password, userMnemonic).catch(error => {
        console.error(error);
      });
      break;
    case "start":
      start(filename, password).catch(error => {
        console.error(error);
      });
      break;
    default:
      throw new Error("Unexpected action argument");
  }
}

main(process.argv.slice(2));
