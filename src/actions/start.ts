import fs from "fs";
import ip from "ip";
import Koa from "koa";
import bodyParser from "koa-bodyparser";

import { BcpConnection, RecipientId, SendTx, TokenTicker, TransactionKind } from "@iov/bcp-types";
import { bnsConnector } from "@iov/bns";
import { MultiChainSigner } from "@iov/core";
import { liskConnector } from "@iov/lisk";
import { ChainId, PublicKeyBundle } from "@iov/tendermint-types";

import { Codec } from "../codec";
import { debugBalance } from "../debugging";
import { identityInfosOfFirstChain } from "../multichainhelpers";
import { loadProfile } from "../profile";

async function sendTransaction(
  signer: MultiChainSigner,
  address: string,
  chainId: ChainId,
  ticker: string,
): Promise<SendTx> {
  const wallet = signer.profile.wallets.value[0];
  const identities = signer.profile.getIdentities(wallet.id);
  const sender = identities[Math.floor(Math.random() * Math.floor(20))];

  // TODO: Add validation of address for requested chain

  console.log("Sender address: ", signer.keyToAddress(chainId, sender.pubkey));
  const sendTx: SendTx = {
    kind: TransactionKind.Send,
    chainId: chainId as ChainId,
    signer: sender.pubkey as PublicKeyBundle,
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

export async function start(
  filename: string,
  password: string,
  codec: Codec,
  blockchainBaseUrl: string,
  port: number,
): Promise<void> {
  if (!fs.existsSync(filename)) {
    throw Error("File does not exist on disk, did you mean to -init- your profile?");
  }
  const profile = await loadProfile(filename, password);
  const signer = new MultiChainSigner(profile);

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
