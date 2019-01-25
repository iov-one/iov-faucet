import {
  Amount,
  BcpAccount,
  BcpTransactionState,
  PublicIdentity,
  PublicKeyBundle,
  SendTransaction,
  TokenTicker,
} from "@iov/bcp-types";
import { Address, MultiChainSigner, UserProfile } from "@iov/core";

import { needsRefill, refillAmount } from "./cashflow";
import { debugAccount, logAccountsState, logSendJob } from "./debugging";

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function identitiesOfFirstWallet(profile: UserProfile): ReadonlyArray<PublicIdentity> {
  const wallet = profile.wallets.value[0];
  return profile.getIdentities(wallet.id);
}

export function identityToAddress(signer: MultiChainSigner, identity: PublicIdentity): Address {
  return signer.identityToAddress(identity);
}

export async function accountsOfFirstChain(
  profile: UserProfile,
  signer: MultiChainSigner,
): Promise<ReadonlyArray<BcpAccount>> {
  const addresses = identitiesOfFirstWallet(profile).map(identity => signer.identityToAddress(identity));
  const chainId = signer.chainIds()[0];

  // tslint:disable-next-line:readonly-array
  const out: BcpAccount[] = [];
  for (const address of addresses) {
    const response = await signer.connection(chainId).getAccount({ address: address });
    if (response) {
      out.push({
        address: response.address,
        balance: response.balance,
      });
    } else {
      out.push({
        address: address,
        balance: [],
      });
    }
  }

  return out;
}

export async function tokenTickersOfFirstChain(
  signer: MultiChainSigner,
): Promise<ReadonlyArray<TokenTicker>> {
  const chainId = signer.chainIds()[0];
  return (await signer.connection(chainId).getAllTickers()).map(token => token.tokenTicker);
}

export interface SendJob {
  readonly sender: PublicIdentity;
  readonly recipient: Address;
  readonly tokenTicker: TokenTicker;
  readonly amount: Amount;
}

export async function sendOnFirstChain(
  profile: UserProfile,
  signer: MultiChainSigner,
  job: SendJob,
): Promise<void> {
  const chainId = signer.chainIds()[0];
  const wallet = profile.wallets.value[0];
  const sendTxJson: SendTransaction = {
    kind: "bcp/send",
    creator: {
      chainId: chainId,
      pubkey: job.sender.pubkey as PublicKeyBundle,
    },
    recipient: job.recipient,
    memo: "We ❤️ developers – iov.one",
    amount: job.amount,
  };

  const post = await signer.signAndPost(sendTxJson, wallet.id);
  await post.blockInfo.waitFor(info => info.state === BcpTransactionState.InBlock);
}

export async function refillFirstChain(profile: UserProfile, signer: MultiChainSigner): Promise<void> {
  const chainId = signer.chainIds()[0];

  console.log(`Connected to network: ${chainId}`);
  console.log(`Tokens on network: ${(await tokenTickersOfFirstChain(signer)).join(", ")}`);

  const holderIdentity = identitiesOfFirstWallet(profile)[0];

  const accounts = await accountsOfFirstChain(profile, signer);
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
        amount: refillAmount(token),
      });
    }
  }
  if (jobs.length > 0) {
    for (const job of jobs) {
      logSendJob(signer, job);
      await sendOnFirstChain(profile, signer, job);
      await sleep(50);
    }

    console.log(
      // TODO: log something clever when we have https://github.com/iov-one/iov-core/issues/413
      "Done refilling accounts. Depending on the chain, the transactions may take some time to be processed.",
    );
    logAccountsState(await accountsOfFirstChain(profile, signer));
  } else {
    console.log("Nothing to be done. Anyways, thanks for checking.");
  }
}
