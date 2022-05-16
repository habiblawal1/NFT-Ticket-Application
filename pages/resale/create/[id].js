import { useRouter } from "next/router";
import { ethers } from "ethers";
import { useState, useEffect } from "react";
import axios from "axios";

import MaticPrice from "../../../components/price/Matic";
import PoundPrice from "../../../components/price/Pound";
import { nftaddress } from "../../../config";
import { signers, tokenContract } from "../../../components/Contracts";

export default function resellTicket() {
  const router = useRouter();
  const ticketId = router.query["id"];

  const [err, setErr] = useState("");
  const [loadingState, setLoadingState] = useState(false);
  const [resalePrice, setResalePrice] = useState({ matic: "0", gbp: "" });
  const [royaltyFee, setRoyaltyFee] = useState("");
  const [maxPrice, setMaxPrice] = useState({ matic: "", gbp: "0" });

  useEffect(() => {
    if (!router.isReady) return;
    loadResaleDetails();
    setLoadingState(true);
  }, [router.isReady]);
  async function loadResaleDetails() {
    try {
      if (!Number.isInteger(parseInt(ticketId))) {
        throw new Error("Ticket ID was not valid");
      }
      const signedContracts = await signers();
      const { signer } = signedContracts;
      const address = signer.getAddress();
      const qty = await tokenContract.balanceOf(address, ticketId);
      if (qty < 1) {
        throw new Error(`You do not own the Ticket ID: ${ticketId}`);
      }
      const ticketUri = await tokenContract.uri(ticketId);
      const ticketRequest = await axios.get(ticketUri);
      const ticketData = ticketRequest.data;
      const maxResalePrice = ticketData.properties.maxResalePrice;
      const gbpMaxPrice = await PoundPrice(maxResalePrice);
      setMaxPrice({ matic: maxResalePrice, gbp: gbpMaxPrice });
      setRoyaltyFee(ticketData.properties.royaltyFee);
      console.log(ticketData);
    } catch (error) {
      console.log(error);
      error.data === undefined
        ? setErr(error.message)
        : setErr(error.data.message);
    }
  }
  async function listForResale() {
    try {
      setLoadingState(false);
      if (!resalePrice.gbp || !(resalePrice.gbp >= 0)) {
        throw new Error("Please enter a postive price");
      }

      if (resalePrice.gbp > maxPrice.gbp) {
        throw new Error("Resale price must be less than the max price");
      }
      console.log("RESALE GBP = ", resalePrice.gbp);
      const contracts = await signers();
      const { signedMarketContract, signedTokenContract } = contracts;

      let price = ethers.utils.parseUnits(resalePrice.matic, "ether");
      const approvalTransaction = await signedTokenContract.giveResaleApproval(
        ticketId
      );
      await approvalTransaction.wait();

      const resaleTransaction = await signedMarketContract.listOnResale(
        nftaddress,
        ticketId,
        price
      );
      await resaleTransaction.wait();
      setLoadingState(true);
      router.push("/resale");
    } catch (error) {
      setLoadingState(true);
      console.log(error);
      error.data === undefined
        ? setErr(error.message)
        : setErr(error.data.message);
    }
  }

  async function updatePrice(value) {
    const maticPrice = await MaticPrice(value);
    setResalePrice({ gbp: value, matic: maticPrice });
  }

  if (!loadingState) {
    return <h1 className="container display-1">Loading...</h1>;
  }

  if (!royaltyFee && err) {
    return <p className="container text-danger display-6">{err}</p>;
  }

  return (
    <div className="container">
      <h1 className="text-center m-4">
        Create Resale Listing for Ticket ID: #{ticketId}
      </h1>
      <label htmlFor="royalty" className="form-label">
        Royalty Fee
      </label>
      <div className="input-group mb-3">
        <input
          className="form-control"
          type="text"
          value={royaltyFee}
          aria-label="royalty"
          disabled
          readOnly
        />
        <span className="input-group-text" id="percent">
          %
        </span>
      </div>

      <label htmlFor="resale" className="form-label">
        Max Resale Price
      </label>
      <div className="input-group mb-3">
        <span className="input-group-text" id="pound">
          £
        </span>
        <input
          className="form-control"
          type="text"
          value={maxPrice.gbp}
          aria-label="resale"
          disabled
          readOnly
        />
      </div>
      <div style={{ marginBottom: "20px" }} className="form-text">
        = {maxPrice.matic} MATIC
      </div>

      <label htmlFor="price" className="form-label">
        Choose Resale Price
      </label>
      <div className="input-group mb-3">
        <span className="input-group-text" id="pound">
          £
        </span>
        <input
          type="text"
          className="form-control"
          aria-label="price"
          aria-describedby="pound"
          onChange={(e) => {
            updatePrice(e.target.value);
          }}
          required
        />
      </div>
      <div style={{ marginBottom: "20px" }} className="form-text">
        = {resalePrice.matic} MATIC
      </div>
      <button onClick={listForResale} className="btn btn-lg btn-primary">
        List
      </button>
      {err && <p className="text-danger display-6">{err}</p>}
    </div>
  );
}
