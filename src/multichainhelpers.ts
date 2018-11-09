import { BcpAccount, SendTx, TokenTicker, TransactionKind } from "@iov/bcp-types";
import { Address, MultiChainSigner } from "@iov/core";
import { PublicIdentity } from "@iov/keycontrol";
import { ChainId, PublicKeyBundle } from "@iov/tendermint-types";

import { needsRefill, refillAmount } from "./cashflow";
import { debugAccount, logAccountsState, logSendJob } from "./debugging";

export function identitiesOfFirstChain(signer: MultiChainSigner): ReadonlyArray<PublicIdentity> {
  const wallet = signer.profile.wallets.value[0];
  return signer.profile.getIdentities(wallet.id);
}

export function identityToAddress(signer: MultiChainSigner, identity: PublicIdentity): Address {
  const chainId = signer.chainIds()[0];
  return signer.keyToAddress(chainId, identity.pubkey);
}

export async function accountsOfFirstChain(signer: MultiChainSigner): Promise<ReadonlyArray<BcpAccount>> {
  const addresses = identitiesOfFirstChain(signer).map(identity => identityToAddress(signer, identity));
  const chainId = signer.chainIds()[0];

  // tslint:disable-next-line:readonly-array
  const out: BcpAccount[] = [];
  for (const address of addresses) {
    const responsesPromise = signer.connection(chainId).getAccount({ address: address });
    const responseData = (await responsesPromise).data;

    switch (responseData.length) {
      case 0:
        out.push({
          address: address,
          balance: [],
        });
        break;
      case 1:
        out.push({
          address: responseData[0].address,
          balance: responseData[0].balance,
        });
        break;
      default:
        throw new Error(`unexpected number of data fields: ${responseData.length}`);
    }
  }

  return out;
}

export async function tokenTickersOfFirstChain(
  signer: MultiChainSigner,
): Promise<ReadonlyArray<TokenTicker>> {
  const chainId = signer.chainIds()[0];
  return (await signer.connection(chainId).getAllTickers()).data.map(token => token.tokenTicker);
}

export interface SendJob {
  readonly sender: PublicIdentity;
  readonly recipient: Address;
  readonly tokenTicker: TokenTicker;
  readonly wholeAmount: number; // whole numbers only
}

export async function sendOnFirstChain(signer: MultiChainSigner, job: SendJob): Promise<void> {
  const chainId = signer.chainIds()[0];
  const wallet = signer.profile.wallets.value[0];
  const sendTx: SendTx = {
    kind: TransactionKind.Send,
    chainId: chainId as ChainId,
    signer: job.sender.pubkey as PublicKeyBundle,
    recipient: job.recipient,
    memo: "We ❤️ developers – iov.one",
    amount: {
      whole: Math.floor(job.wholeAmount),
      fractional: 0,
      tokenTicker: job.tokenTicker,
    },
  };

  await signer.signAndCommit(sendTx, wallet.id);
}

export async function refillFirstChain(signer: MultiChainSigner): Promise<void> {
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
        wholeAmount: refillAmount(token),
      });
    }
  }

  if (jobs.length > 0) {
    for (const job of jobs) {
      logSendJob(signer, job);
      await sendOnFirstChain(signer, job);
    }

    console.log(
      // TODO: log something clever when we have https://github.com/iov-one/iov-core/issues/413
      "Done refilling accounts. Depending on the chain, the transactions may take some time to be processed.",
    );
    logAccountsState(await accountsOfFirstChain(signer));
  } else {
    console.log("Nothing to be done. Anyways, thanks for checking.");
  }
}
