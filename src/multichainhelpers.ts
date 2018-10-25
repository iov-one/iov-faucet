import { BcpAccount, SendTx, TokenTicker, TransactionKind } from "@iov/bcp-types";
import { Address, MultiChainSigner } from "@iov/core";
import { PublicIdentity } from "@iov/keycontrol";
import { ChainId, PublicKeyBundle } from "@iov/tendermint-types";

export function identitiesOfFirstChain(signer: MultiChainSigner): ReadonlyArray<PublicIdentity> {
  const wallet = signer.profile.wallets.value[0];
  return signer.profile.getIdentities(wallet.id);
}

export function identityToAddress(signer: MultiChainSigner, identity: PublicIdentity): Address {
  const chainId = signer.chainIds()[0];
  return signer.keyToAddress(chainId, identity.pubkey);
}

export async function identityInfosOfFirstChain(
  signer: MultiChainSigner,
): Promise<ReadonlyArray<BcpAccount>> {
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

export interface SendJob {
  readonly sender: PublicIdentity;
  readonly recipient: Address;
  readonly tokenTicker: TokenTicker;
  readonly amount: number; // whole numbers only
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
      whole: Math.floor(job.amount),
      fractional: 0,
      tokenTicker: job.tokenTicker,
    },
  };

  await signer.signAndCommit(sendTx, wallet.id);
}
