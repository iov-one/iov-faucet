import { BcpAccount, SendTx, TokenTicker, TransactionKind } from "@iov/bcp-types";
import { Address, MultiChainSigner } from "@iov/core";
import { PublicIdentity } from "@iov/keycontrol";
import { ChainId, PublicKeyBundle } from "@iov/tendermint-types";

export function identitiesOfFirstChain(signer: MultiChainSigner): ReadonlyArray<PublicIdentity> {
  const wallet = signer.profile.wallets.value[0];
  return signer.profile.getIdentities(wallet.id);
}

export function addressesOfFirstChain(signer: MultiChainSigner): ReadonlyArray<Address> {
  const chainId = signer.chainIds()[0];
  const addresses = identitiesOfFirstChain(signer).map(identity =>
    signer.keyToAddress(chainId, identity.pubkey),
  );
  return addresses;
}

export async function identityInfosOfFirstChain(
  signer: MultiChainSigner,
): Promise<ReadonlyArray<BcpAccount>> {
  const addresses = addressesOfFirstChain(signer);
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

export async function sendTransaction(
  signer: MultiChainSigner,
  chainId: ChainId,
  sender: PublicIdentity,
  recipient: Address,
  ticker: string,
  amount: number,
): Promise<SendTx> {
  const wallet = signer.profile.wallets.value[0];

  // TODO: Add validation of address for requested chain

  console.log("Sender address: ", signer.keyToAddress(chainId, sender.pubkey));
  const sendTx: SendTx = {
    kind: TransactionKind.Send,
    chainId: chainId as ChainId,
    signer: sender.pubkey as PublicKeyBundle,
    recipient: recipient,
    memo: "We ❤️ developers – iov.one",
    amount: {
      whole: Math.floor(amount),
      fractional: 0,
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
