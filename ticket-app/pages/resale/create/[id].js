import { useRouter } from "next/router";
import { ethers } from "ethers";
import { useState, useEffect } from "react";
import Web3Modal from "web3modal";
import axios from "axios";

import { nftaddress, nftmarketaddress } from "../../../config";

import NFT from "../../../artifacts/contracts/NFTTicket.sol/NFTTicket.json";
import Market from "../../../artifacts/contracts/TicketMarket.sol/TicketMarket.json";

export default function resellTicket() {
  const router = useRouter();
  const ticketId = router.query["id"];

  const [err, setErr] = useState("");
  const [resalePrice, setResalePrice] = useState("");
  const [royaltyFee, setRoyaltyFee] = useState("0");
  const [maxPrice, setMaxPrice] = useState("0");

  useEffect(() => {
    if (!router.isReady) return;
    loadResaleDetails();
  }, [router.isReady]);
  //TODO - Check tokenId exists
  //TODO - Once a ticket has been validated, don't allow them to set the ticket on resale
  async function loadResaleDetails() {
    const provider = new ethers.providers.JsonRpcProvider();
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);

    const ticketUri = await tokenContract.uri(ticketId);
    const ticketRequest = await axios.get(ticketUri);
    const ticketData = ticketRequest.data;
    setMaxPrice(ticketData.properties.maxResalePrice);
    setRoyaltyFee(ticketData.properties.royaltyFee);
    console.log(ticketData);
  }

  async function listForResale() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, signer);
    //We need to povide a signer instead of JSONRPC so we know who the signer is
    const marketContract = new ethers.Contract(
      nftmarketaddress,
      Market.abi,
      signer
    );

    try {
      let price = ethers.utils.parseUnits(resalePrice, "ether");
      const approvalTransaction = await tokenContract.giveResaleApproval(
        ticketId
      );
      await approvalTransaction.wait();

      const resaleTransaction = await marketContract.listOnResale(
        nftaddress,
        ticketId,
        price
      );
      await resaleTransaction.wait();

      router.push("/resale");
    } catch (error) {
      console.error(error);
      if (error.data) {
        setErr(error.data.message);
      } else {
        setErr(error.message);
      }
    }
  }

  return (
    <div>
      <h1>Create Resale listing for ticket: #{ticketId}</h1>
      <div className="flex justify-center">
        <div className="w-1/2 flex flex-col pb-12">
          <label>
            Royalty Fee
            <input
              value={`${royaltyFee}%`}
              className="mt-4 border rounded p-4 bg-zinc-400"
              disabled
            />
          </label>
          <label>
            Max Resale Price
            <input
              value={`${maxPrice} MATIC`}
              className="mt-4 border rounded p-4 bg-zinc-400"
              disabled
            />
          </label>
          {/** TODO - Add conversion for MATIC to GBP*/}
          {/** TODO - Declare which fields are required*/}
          <input
            placeholder="Ticket Price (MATIC)"
            className="mt-4 border rounded p-4"
            onChange={(e) => setResalePrice(e.target.value)}
          />
          <button
            onClick={listForResale}
            className="font-bold mt-4 bg-blue-500 text-white rounded p-4 shadow-lg"
          >
            List
          </button>
          {err && (
            <p
              style={{ height: "64px" }}
              className="text-red-500 font-semibold"
            >
              {err}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
