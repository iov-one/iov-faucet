import fs from "fs";
import Koa from "koa";
import bodyParser from "koa-bodyparser";

import { BcpConnection } from "@iov/bcp-types";
import { bnsConnector } from "@iov/bns";
import { MultiChainSigner } from "@iov/core";
import { liskConnector } from "@iov/lisk";

import { Codec, codecFromString } from "../codec";
import * as constants from "../constants";
import { debugAccount, logAccountsState } from "../debugging";
import {
  accountsOfFirstChain,
  identitiesOfFirstChain,
  identityToAddress,
  SendJob,
  sendOnFirstChain,
  tokenTickersOfFirstChain,
} from "../multichainhelpers";
import { loadProfile } from "../profile";

let count = 0;

/** returns an integer >= 0 that increments and is unique in module scope */
function getCount(): number {
  return count++;
}

export async function start(args: ReadonlyArray<string>): Promise<void> {
  if (args.length < 4) {
    throw Error(`Not enough arguments for action 'start'. See README for arguments`);
  }
  const filename = args[0];
  const password = args[1];
  const codec = codecFromString(args[2]);
  const blockchainBaseUrl: string = args[3];

  const port = constants.port;

  if (!fs.existsSync(filename)) {
    throw Error("File does not exist on disk, did you mean to -init- your profile?");
  }
  const profile = await loadProfile(filename, password);
  const signer = new MultiChainSigner(profile);

  console.log("Connecting to blockchain ...");
  let connection: BcpConnection;
  switch (codec) {
    case Codec.Bns:
      connection = (await signer.addChain(bnsConnector(blockchainBaseUrl))).connection;
      break;
    case Codec.Lisk:
      connection = (await signer.addChain(liskConnector(blockchainBaseUrl))).connection;
      break;
    default:
      throw new Error("No connector for this codec defined");
  }

  const connectedChainId = connection.chainId();
  console.log(`Connected to network: ${connectedChainId}`);

  const accounts = await accountsOfFirstChain(signer);
  logAccountsState(accounts);
  const holderAccount = accounts[0];

  const chainTokens = await tokenTickersOfFirstChain(signer);
  console.log("Chain tokens:", chainTokens);

  const availableTokens = holderAccount.balance.map(coin => coin.tokenTicker);
  console.log("Available tokens:", availableTokens);

  const distibutorIdentities = identitiesOfFirstChain(signer).slice(1);

  console.log("Creating webserver ...");
  const api = new Koa();
  api.use(bodyParser());

  api.use(async context => {
    switch (context.path) {
      case "/status":
        const updatedAccounts = await accountsOfFirstChain(signer);
        const updatedAvailableTokens = updatedAccounts[0].balance.map(coin => coin.tokenTicker);
        // tslint:disable-next-line:no-object-mutation
        context.response.body = {
          status: "ok",
          nodeUrl: blockchainBaseUrl,
          chainId: connectedChainId,
          chainTokens: chainTokens,
          availableTokens: updatedAvailableTokens,
          holder: updatedAccounts[0],
          distributors: updatedAccounts.slice(1),
        };
        break;
      case "/getTokens":
        // TODO: Allow requests using GET + query params
        if (context.request.method === "GET") {
          // tslint:disable-next-line:no-object-mutation
          context.response.body = "This endpoint requires a POST request, with fields: address and ticker.";
          break;
        }

        // TODO: Better error handling on request body being empty?
        const { ticker, address } = context.request.body;
        if (!address) {
          // tslint:disable-next-line:no-object-mutation
          context.response.body = "Empty address.";
          break;
        }

        if (!ticker) {
          // tslint:disable-next-line:no-object-mutation
          context.response.body = "Empty ticker";
          break;
        }

        if (chainTokens.indexOf(ticker) === -1) {
          // tslint:disable-next-line:no-object-mutation
          context.response.body = "Invalid Ticker. Valid tickers are: " + JSON.stringify(chainTokens);
          break;
        }

        const sender = distibutorIdentities[getCount() % distibutorIdentities.length];

        try {
          // TODO: Add validation of address for requested chain
          const job: SendJob = {
            sender: sender,
            recipient: address,
            amount: 1,
            tokenTicker: ticker,
          };
          console.log(
            `Sending ${job.tokenTicker} from ${identityToAddress(signer, job.sender)} to ${
              job.recipient
            } ...`,
          );
          await sendOnFirstChain(signer, job);
        } catch (e) {
          console.log(e);
          // tslint:disable-next-line:no-object-mutation
          context.response.body = "Send failed";
          break;
        }

        // tslint:disable-next-line:no-object-mutation
        context.response.body = "ok";
        break;
      default:
      // koa sends 404 by default
    }
  });
  console.log(`Started webserver on port ${port}`);
  api.listen(port);
}
