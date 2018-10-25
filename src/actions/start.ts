import fs from "fs";
import ip from "ip";
import Koa from "koa";
import bodyParser from "koa-bodyparser";

import { BcpConnection } from "@iov/bcp-types";
import { bnsConnector } from "@iov/bns";
import { MultiChainSigner } from "@iov/core";
import { liskConnector } from "@iov/lisk";

import { Codec, codecFromString } from "../codec";
import * as constants from "../constants";
import { debugBalance } from "../debugging";
import { identityInfosOfFirstChain, sendTransaction } from "../multichainhelpers";
import { loadProfile } from "../profile";

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

  // Don't wait for result. Just print when it is there
  identityInfosOfFirstChain(signer)
    .then(result => {
      console.log("Identities:\n" + result.map(r => `  ${r.address}: ${debugBalance(r.balance)}`).join("\n"));
    })
    .catch(error => {
      console.error("Error getting identity infos:", error);
    });

  console.log("Creating webserver ...");
  const api = new Koa();
  api.use(bodyParser());

  api.use(async context => {
    switch (context.path) {
      case "/state":
        // tslint:disable-next-line:no-object-mutation
        context.response.body = {
          status: "ok",
          nodeUrl: ip.address(),
          chainId: connectedChainId,
          identities: await identityInfosOfFirstChain(signer),
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
          sendTx = await sendTransaction(signer, address, chainId, ticker);
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
