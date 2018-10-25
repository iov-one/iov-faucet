import fs from "fs";

import { Address, BcpAccount, BcpConnection, TokenTicker } from "@iov/bcp-types";
import { bnsConnector } from "@iov/bns";
import { MultiChainSigner } from "@iov/core";
import { liskConnector } from "@iov/lisk";

import { Codec, codecFromString } from "../codec";
import * as constants from "../constants";
import { debugAccount } from "../debugging";
import {
  accountsOfFirstChain,
  identitiesOfFirstChain,
  SendJob,
  sendOnFirstChain,
} from "../multichainhelpers";
import { loadProfile } from "../profile";

function needsRefill(account: BcpAccount, token: TokenTicker): boolean {
  const coin = account.balance.find(balance => balance.tokenTicker === token);

  const tokenBalance = coin ? coin.whole : 0; // truncates fractional

  return tokenBalance < constants.creditAmounts.get(token) * constants.refillThreshold;
}

function logAccountsState(accounts: ReadonlyArray<BcpAccount>): void {
  const holder = accounts[0];
  const distributors = accounts.slice(1);
  console.log("Holder:\n" + `  ${debugAccount(holder)}`);
  console.log("Distributors:\n" + distributors.map(r => `  ${debugAccount(r)}`).join("\n"));
}

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

  const holderIdentity = identitiesOfFirstChain(signer)[0];

  const accounts = await accountsOfFirstChain(signer);
  logAccountsState(accounts);
  const holderAccount = accounts[0];
  const distributorAccounts = accounts.slice(1);

  const availableTokens = holderAccount.balance.map(coin => coin.tokenTicker);
  console.log("Available tokens:", availableTokens);

  // tslint:disable-next-line:readonly-array
  const jobs: SendJob[] = [];

  for (const token of availableTokens) {
    const refillDistibutors = distributorAccounts.filter(account => needsRefill(account, token));
    console.log(`Refilling ${token} of:`);
    console.log(
      refillDistibutors.length ? refillDistibutors.map(r => `  ${debugAccount(r)}`).join("\n") : "  none",
    );
    for (const refillDistibutor of refillDistibutors) {
      jobs.push({
        sender: holderIdentity,
        recipient: refillDistibutor.address,
        tokenTicker: token,
        amount: constants.creditAmounts.get(token) * constants.refillAmount,
      });
    }
  }

  for (const job of jobs) {
    await sendOnFirstChain(signer, job);
  }

  console.log("Done refilling accounts.");
  logAccountsState(await accountsOfFirstChain(signer));

  // shut down
  signer.chainIds().map(chainId => signer.connection(chainId).disconnect());
}
