import fs from "fs";
import ip from "ip";
import Koa from "koa";
import bodyParser from "koa-bodyparser";

import { RecipientId, SendTx, TokenTicker, TransactionKind } from "@iov/bcp-types";
import { bnsCodec, bnsConnector } from "@iov/bns";
import { MultiChainSigner } from "@iov/core";
import { Bip39, Random } from "@iov/crypto";
import { UserProfile } from "@iov/keycontrol";
import { liskCodec, liskConnector } from "@iov/lisk";
import { ChainId, PublicKeyBundle } from "@iov/tendermint-types";

import { Codec, codecFromString } from "./codec";
import { loadProfile, setSecretAndCreateIdentities, storeProfile } from "./profile";

let profile; // Bad global var, I don't know what else to do...
let signer;

async function createPassphrase(entropy: number = 16): Promise<string> {
  const randomBytes = await Random.getBytes(entropy);
  const mnemonic: string = Bip39.encode(randomBytes).asString();
  console.log("Faucet master passphrase: " + mnemonic);
  return mnemonic;
}

function getAddresses(codec: Codec): ReadonlyArray<string> {
  let addresses;
  const wallet = profile.wallets.value[0];
  const id1 = profile.getIdentities(wallet.id);
  switch (codec) {
    case Codec.Bns:
      addresses = id1.map(count => bnsCodec.keyToAddress(count.pubkey));
      break;
    case Codec.Lisk:
      addresses = id1.map(count => liskCodec.keyToAddress(count.pubkey));
      break;
  }
  console.log("Got addresses: " + addresses);

  return addresses;
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
  const initProfile = new UserProfile();
  const mnemonic = await createPassphrase();
  await setSecretAndCreateIdentities(initProfile, userMnemonic ? userMnemonic : mnemonic);
  await storeProfile(initProfile, filename, password);
}

async function start(filename: string, password: string, port: number): Promise<void> {
  if (!fs.existsSync(filename)) {
    throw Error("File does not exist on disk, did you mean to -initialize- your profile?");
  }
  profile = await loadProfile(filename, password);

  signer = new MultiChainSigner(profile);
  await signer.addChain(bnsConnector("wss://bov.friendnet-fast.iov.one"));
  await signer.addChain(bnsConnector("wss://bov.friendnet-slow.iov.one"));
  await signer.addChain(liskConnector("https://testnet.lisk.io"));
  console.log("Connected to networks: " + signer.chainIds());

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
          bnsAddresses: getAddresses(Codec.Bns),
          liskAddresses: getAddresses(Codec.Lisk),
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
  console.log(`Started webserver on port ${port}`);
  api.listen(port);
}

function main(args: ReadonlyArray<string>): void {
  if (args.length < 4) {
    throw Error("Not enough arguments. See documentation on github for arguments");
  }

  const action = args[0];
  const filename = args[1];
  const password = args[2];
  const codec: Codec = codecFromString(args[3]);
  const userMnemonic: string | undefined = args[4];

  switch (action) {
    case "initialize":
      initialize(filename, password, userMnemonic).catch(error => {
        console.error(error);
      });
      break;
    case "start":
      start(filename, password, 8000).catch(error => {
        console.error(error);
      });
      break;
    default:
      throw new Error("Unexpected action argument");
  }
}

main(process.argv.slice(2));
