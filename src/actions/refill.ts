import fs from "fs";

import { BcpAccount, TokenTicker } from "@iov/bcp-types";
import { MultiChainSigner } from "@iov/core";

import { chainConnector, codecFromString } from "../codec";
import * as constants from "../constants";
import { debugAccount, logAccountsState, logSendJob } from "../debugging";
import {
  accountsOfFirstChain,
  identitiesOfFirstChain,
  SendJob,
  sendOnFirstChain,
  tokenTickersOfFirstChain,
} from "../multichainhelpers";
import { loadProfile } from "../profile";

function creditAmount(token: TokenTicker): number {
  return constants.creditAmounts.get(token) || constants.creditAmountDefault;
}

function needsRefill(account: BcpAccount, token: TokenTicker): boolean {
  const coin = account.balance.find(balance => balance.tokenTicker === token);

  const tokenBalance = coin ? coin.whole : 0; // truncates fractional

  return tokenBalance < creditAmount(token) * constants.refillThreshold;
}

async function refillFirstChain(signer: MultiChainSigner): Promise<void> {
  const chainId = signer.chainIds()[0];

  console.log(`Connected to network: ${chainId}`);
  console.log(`Tokens on network: ${(await tokenTickersOfFirstChain(signer)).join(", ")}`);

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
        amount: creditAmount(token) * constants.refillAmount,
      });
    }
  }

  if (jobs.length > 0) {
    for (const job of jobs) {
      logSendJob(signer, job);
      await sendOnFirstChain(signer, job);
    }

    console.log("Done refilling accounts.");
    logAccountsState(await accountsOfFirstChain(signer));
  } else {
    console.log("Nothing to be done. Anyways, thanks for checking.");
  }
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
  await signer.addChain(chainConnector(codec, blockchainBaseUrl));

  await refillFirstChain(signer);

  // shut down
  signer.chainIds().map(chainId => signer.connection(chainId).disconnect());
}
