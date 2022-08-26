import Web3Modal from "web3modal";
import { ethers } from "ethers";

import { nftaddress, nftmarketaddress } from "../config";
import NFT from "../artifacts/contracts/NFTTicket.sol/NFTTicket.json";
import Market from "../artifacts/contracts/TicketMarket.sol/TicketMarket.json";

const providerUrl = process.env.NEXT_PUBLIC_INFURA_URL;
const provider = new ethers.providers.JsonRpcProvider(providerUrl);
//used to access contract functions which do not require a signature
export const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
export const marketContract = new ethers.Contract(
  nftmarketaddress,
  Market.abi,
  provider
);

export const signers = async () => {
  const web3Modal = new Web3Modal();
  const connection = await web3Modal.connect();
  const signedProvider = new ethers.providers.Web3Provider(connection);
  //gets address of wallet connected to Metamask
  const signer = signedProvider.getSigner();

  //used to access contract functions which do require a signature for a transaction
  const signedTokenContract = new ethers.Contract(nftaddress, NFT.abi, signer);
  const signedMarketContract = new ethers.Contract(
    nftmarketaddress,
    Market.abi,
    signer
  );
  return { signedMarketContract, signer, signedTokenContract };
};
