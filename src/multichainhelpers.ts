import {
  Account,
  Address,
  Amount,
  Identity,
  isBlockInfoFailed,
  isBlockInfoPending,
  SendTransaction,
  TokenTicker,
  WithCreator,
} from "@iov/bcp";
import { UserProfile } from "@iov/keycontrol";
import { MultiChainSigner } from "@iov/multichain";

import { gasLimit, gasPrice, needsRefill, refillAmount } from "./cashflow";
import { Codec } from "./codec";
import { debugAccount, logAccountsState, logSendJob } from "./debugging";

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function identitiesOfFirstWallet(profile: UserProfile): ReadonlyArray<Identity> {
  const wallet = profile.wallets.value[0];
  return profile.getIdentities(wallet.id);
}

export function identityToAddress(signer: MultiChainSigner, identity: Identity): Address {
  return signer.identityToAddress(identity);
}

export async function accountsOfFirstChain(
  profile: UserProfile,
  signer: MultiChainSigner,
): Promise<ReadonlyArray<Account>> {
  const addresses = identitiesOfFirstWallet(profile).map(identity => signer.identityToAddress(identity));
  const chainId = signer.chainIds()[0];

  // tslint:disable-next-line:readonly-array
  const out: Account[] = [];
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
  return (await signer.connection(chainId).getAllTokens()).map(token => token.tokenTicker);
}

export interface SendJob {
  readonly sender: Identity;
  readonly recipient: Address;
  readonly tokenTicker: TokenTicker;
  readonly amount: Amount;
  readonly gasPrice?: Amount;
  readonly gasLimit?: Amount;
}

/**
 * Creates and posts a send transaction. Then waits until the transaction is in a block.
 */
export async function sendOnFirstChain(
  profile: UserProfile,
  signer: MultiChainSigner,
  job: SendJob,
): Promise<void> {
  const chainId = signer.chainIds()[0];
  const connection = signer.connection(chainId);

  const sendWithFee = await connection.withDefaultFee<SendTransaction & WithCreator>({
    kind: "bcp/send",
    creator: {
      chainId: chainId,
      pubkey: job.sender.pubkey,
    },
    sender: signer.identityToAddress(job.sender),
    recipient: job.recipient,
    memo: "We ❤️ developers – iov.one",
    amount: job.amount,
  });

  const post = await signer.signAndPost(sendWithFee);
  const blockInfo = await post.blockInfo.waitFor(info => !isBlockInfoPending(info));
  if (isBlockInfoFailed(blockInfo)) {
    throw new Error(`Sending tokens failed. Code: ${blockInfo.code}, message: ${blockInfo.message}`);
  }
}

export async function refillFirstChain(
  profile: UserProfile,
  signer: MultiChainSigner,
  codec: Codec,
): Promise<void> {
  const chainId = signer.chainIds()[0];

  console.log(`Connected to network: ${chainId}`);
  console.log(`Tokens on network: ${(await tokenTickersOfFirstChain(signer)).join(", ")}`);

  const holderIdentity = identitiesOfFirstWallet(profile)[0];

  const accounts = await accountsOfFirstChain(profile, signer);
  logAccountsState(accounts);
  const holderAccount = accounts[0];
  const distributorAccounts = accounts.slice(1);

  const availableTokens = availableTokensFromHolder(holderAccount);
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
        gasPrice: gasPrice(codec),
        gasLimit: gasLimit(codec),
      });
    }
  }
  if (jobs.length > 0) {
    for (const job of jobs) {
      logSendJob(signer, job);
      await sendOnFirstChain(profile, signer, job);
      await sleep(50);
    }

    console.log("Done refilling accounts.");
    logAccountsState(await accountsOfFirstChain(profile, signer));
  } else {
    console.log("Nothing to be done. Anyways, thanks for checking.");
  }
}

export function availableTokensFromHolder(holderAccount: Account): ReadonlyArray<TokenTicker> {
  return holderAccount.balance.map(coin => coin.tokenTicker);
}
