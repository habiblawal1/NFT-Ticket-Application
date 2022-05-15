import Web3Modal from "web3modal";
import { ethers } from "ethers";

import { nftaddress, nftmarketaddress } from "../config";
import NFT from "../artifacts/contracts/NFTTicket.sol/NFTTicket.json";
import Market from "../artifacts/contracts/TicketMarket.sol/TicketMarket.json";

const providerUrl = process.env.NEXT_PUBLIC_INFURA_URL;
console.log("Provider URL = ", providerUrl);
const provider = new ethers.providers.JsonRpcProvider(providerUrl);
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
  const signer = signedProvider.getSigner();

  const signedTokenContract = new ethers.Contract(nftaddress, NFT.abi, signer);
  const signedMarketContract = new ethers.Contract(
    nftmarketaddress,
    Market.abi,
    signer
  );
  return { signedMarketContract, signer, signedTokenContract };
};
