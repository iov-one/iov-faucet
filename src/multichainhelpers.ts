import { BcpAccount, RecipientId, SendTx, TokenTicker, TransactionKind } from "@iov/bcp-types";
import { Address, MultiChainSigner } from "@iov/core";
import { ChainId, PublicKeyBundle } from "@iov/tendermint-types";

function addressesOfFirstChain(signer: MultiChainSigner): ReadonlyArray<Address> {
  const wallet = signer.profile.wallets.value[0];
  const chainId = signer.chainIds()[0];

  const addresses = signer.profile
    .getIdentities(wallet.id)
    .map(identity => signer.keyToAddress(chainId, identity.pubkey));
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
