import { useRouter } from "next/router";
import { ethers } from "ethers";
import { useState, useEffect } from "react";
import Web3Modal from "web3modal";
import axios from "axios";

import MaticPrice from "../../../components/price/Matic";
import PoundPrice from "../../../components/price/Pound";

import { nftaddress, nftmarketaddress } from "../../../config";

import NFT from "../../../artifacts/contracts/NFTTicket.sol/NFTTicket.json";
import Market from "../../../artifacts/contracts/TicketMarket.sol/TicketMarket.json";

export default function resellTicket() {
  const router = useRouter();
  const ticketId = router.query["id"];

  const [err, setErr] = useState("");
  const [resalePrice, setResalePrice] = useState({ matic: "0", gbp: "0" });
  const [royaltyFee, setRoyaltyFee] = useState("0");
  const [maxPrice, setMaxPrice] = useState({ matic: "", gbp: "0" });

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
    const maxResalePrice = ticketData.properties.maxResalePrice;
    const gbpMaxPrice = await PoundPrice(maxResalePrice);
    setMaxPrice({ matic: maxResalePrice, gbp: gbpMaxPrice });
    setRoyaltyFee(ticketData.properties.royaltyFee);
    console.log(ticketData);
  }

  async function listForResale() {
    if (!resalePrice.gbp) {
      console.error("Please check you have completed all fields");
      setErr("Please check you have completed all fields");
      return;
    }
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
      let price = ethers.utils.parseUnits(resalePrice.matic, "ether");
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

  async function updatePrice(value) {
    const maticPrice = await MaticPrice(value);
    setResalePrice({ gbp: value, matic: maticPrice });
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
              className="mt-4 border rounded p-4 bg-mid_grey"
              disabled
            />
          </label>
          <label>
            Max Resale Price
            <input
              value={`${maxPrice.matic} MATIC`}
              className="mt-4 border rounded p-4 bg-mid_grey"
              disabled
            />
          </label>
          <p>= £{maxPrice.gbp}</p>
          {/** TODO - Declare which fields are required*/}
          <input
            placeholder="Ticket Price (£GBP)"
            className="mt-4 border rounded p-4"
            onChange={(e) => updatePrice(e.target.value)}
          />
          <p>= {resalePrice.matic} MATIC</p>
          <button
            onClick={listForResale}
            className="font-bold mt-4 bg-primary text-white rounded p-4 shadow-lg"
          >
            List
          </button>
          {err && (
            <p style={{ height: "64px" }} className="text-red font-semibold">
              {err}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
