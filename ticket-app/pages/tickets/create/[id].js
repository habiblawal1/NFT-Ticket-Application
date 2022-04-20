import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { NFTStorage } from "nft.storage";
import { useRouter } from "next/router"; //allows us to programatically route to different routes and read values off of route uri
import axios from "axios";

import MaticPrice from "../../../components/price/Matic";

const client = new NFTStorage({
  token: process.env.NEXT_PUBLIC_NFT_STORAGE_TOKEN,
});

import { nftaddress } from "../../../config";
import { signers } from "../../../components/contracts";
import { positiveInt } from "../../../components/validation";

export default function createTicket() {
  const [err, setErr] = useState("");
  const [loadingState, setLoadingState] = useState(false);
  const [formInput, updateFormInput] = useState({
    name: "",
    description: "",
    price: "",
    priceMATIC: "0",
    purchaseLimit: "",
    amount: "",
    royaltyFee: "",
    maxResalePrice: "",
    maxResalePriceMATIC: "0",
  });
  const [eventName, setEventName] = useState("");
  const router = useRouter();
  const eventId = router.query["id"];
  // url: "ipfs://bafyreih6tmlwwzkphuhenrby6diek3oke6xxphvzxaq4bijtlex2gyfliq/metadata.json";

  useEffect(() => {
    if (!router.isReady) return;
    loadData();
    setLoadingState(true);
  }, [router.isReady]);

  async function loadData() {
    let eventData = "";
    try {
      const contracts = await signers();
      const { signedMarketContract, signer } = contracts;
      if (!Number.isInteger(parseInt(eventId))) {
        throw new Error("Event ID used to create ticket was not valid");
      }
      const data = await signedMarketContract.getEvent(eventId);
      const eventUri = await data.uri;
      const address = await signer.getAddress();
      if (!eventUri) {
        throw new Error("Could not find Event URI");
      } else if (data.owner != address) {
        throw new Error(
          "You do not own the event that you are trying to create a ticket for"
        );
      }

      const eventRequest = await axios.get(eventUri);
      eventData = eventRequest.data;
      setEventName(eventData.name);
    } catch (error) {
      console.log(error);
      error.data === undefined
        ? setErr((oldErr) => [...oldErr, error.message])
        : setErr((oldErr) => [...oldErr, error.data.message]);
    }
    setLoadingState(true);
    return;
  }

  async function getPlaceholderImage() {
    const imageOriginUrl =
      "https://ipfs.io/ipfs/bafkreibmj25canr2btdofjrek7djq4ghn5nwzhlh5t2uf2n6ad4nved4la";
    const r = await fetch(imageOriginUrl);
    if (!r.ok) {
      throw new Error(`error fetching image: [${r.statusCode}]: ${r.status}`);
    }
    return r.blob();
  }

  async function uploadToIPFS() {
    const {
      name,
      description,
      price,
      priceMATIC,
      purchaseLimit,
      amount,
      royaltyFee,
      maxResalePrice,
      maxResalePriceMATIC,
    } = formInput;
    if (
      !name ||
      !price ||
      !amount ||
      !purchaseLimit ||
      !royaltyFee ||
      !maxResalePrice
    ) {
      console.log({
        name,
        price,
        amount,
        purchaseLimit,
        royaltyFee,
        maxResalePrice,
      });
      throw new Error("Please check you have completed all fields");
    }
    positiveInt([amount, purchaseLimit, royaltyFee, price, maxResalePrice]);
    if (Number(amount) < 1) {
      throw new Error("Number of tickets to be created must be higher than 0");
    }

    const image = await getPlaceholderImage();

    /* first, upload metadata to IPFS */
    const data = {
      name,
      description,
      image,
      properties: {
        price: priceMATIC,
        eventId,
        purchaseLimit,
        royaltyFee,
        maxResalePrice: maxResalePriceMATIC,
      },
    };
    const metadata = await client.store(data);
    const url = `https://ipfs.io/ipfs/${metadata.ipnft}/metadata.json`;
    console.log("Metadata URL: ", url);
    return url;
  }

  async function addTicket() {
    const {
      purchaseLimit,
      amount,
      priceMATIC,
      royaltyFee,
      maxResalePriceMATIC,
    } = formInput;
    const contracts = await signers();
    const { signedMarketContract, signedTokenContract } = contracts;

    try {
      setLoadingState(false);
      const url = await uploadToIPFS();
      const ticketPrice = ethers.utils.parseUnits(priceMATIC, "ether");
      const resalePrice = ethers.utils.parseUnits(maxResalePriceMATIC, "ether");

      let tokenId = -1;
      let nftTransaction = await signedTokenContract.createToken(url, amount);
      let nftTx = await nftTransaction.wait();
      nftTx.events.forEach((element) => {
        if (element.event == "NFTTicketCreated") {
          tokenId = element.args.tokenId.toNumber();
        }
      });
      console.log("Token ID = ", tokenId);

      //TODO - Redirect people to page

      const marketTransaction = await signedMarketContract.createMarketTicket(
        eventId,
        tokenId,
        nftaddress,
        purchaseLimit,
        amount,
        ticketPrice,
        royaltyFee,
        resalePrice
      );
      await marketTransaction.wait();

      router.push("/events/my-events");
    } catch (error) {
      console.log(error);
      error.data === undefined
        ? setErr(error.message)
        : setErr(error.data.message);
    }
    setLoadingState(true);
  }

  async function updatePrice(type, value) {
    const maticPrice = await MaticPrice(value);
    if (type == "ticket") {
      updateFormInput({ ...formInput, priceMATIC: maticPrice, price: value });
    } else {
      updateFormInput({
        ...formInput,
        maxResalePriceMATIC: maticPrice,
        maxResalePrice: value,
      });
    }
  }

  if (!loadingState) {
    return <h1 className="px-20 display-1">Loading...</h1>;
  }

  if (!eventName && err.length > 0) {
    return <p className="display-6 text-red">{err}</p>;
  }

  return (
    <div className="container">
      <h1 className="text-center m-4">Create Ticket</h1>
      <p className="display-6 text-center">
        <span className="text-primary fw-bold">{eventName}</span> - ID:{" "}
        {eventId}
      </p>
      <div className="mb-3">
        <label htmlFor="ticketName" className="form-label">
          Ticket Name
        </label>
        <input
          type="text"
          className="form-control"
          id="ticketName"
          onChange={(e) =>
            updateFormInput({ ...formInput, name: e.target.value })
          }
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="description" className="form-label">
          Description
        </label>
        <textarea
          id="description"
          className="form-control"
          aria-label="description"
          rows="3"
          onChange={(e) =>
            updateFormInput({ ...formInput, description: e.target.value })
          }
        ></textarea>
      </div>
      <label htmlFor="price" className="form-label">
        Price
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
            updatePrice("ticket", e.target.value);
          }}
          required
        />
      </div>
      <div style={{ marginBottom: "20px" }} className="form-text">
        = {formInput.priceMATIC} MATIC
      </div>
      <div className="mb-3">
        <label htmlFor="limit" className="form-label">
          Purchase Limit
        </label>
        <input
          type="text"
          placeholder="Maximum tickets a buyer can own at once"
          className="form-control"
          id="limit"
          onChange={(e) =>
            updateFormInput({ ...formInput, purchaseLimit: e.target.value })
          }
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="amount" className="form-label">
          Number of Tickets
        </label>
        <input
          type="text"
          className="form-control"
          id="amount"
          onChange={(e) =>
            updateFormInput({ ...formInput, amount: e.target.value })
          }
          required
        />
      </div>
      <label htmlFor="royalty" className="form-label">
        Royalty Fee
      </label>
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="% fee received if buyer resells ticket"
          aria-label="royalty"
          aria-describedby="percent"
          onChange={(e) =>
            updateFormInput({ ...formInput, royaltyFee: e.target.value })
          }
          required
        />
        <span className="input-group-text" id="percent">
          %
        </span>
      </div>
      <label htmlFor="resle" className="form-label">
        Max Resale Price
      </label>
      <div className="input-group mb-3">
        <span className="input-group-text" id="pound">
          £
        </span>
        <input
          type="text"
          className="form-control"
          aria-label="resle"
          aria-describedby="pound"
          onChange={(e) => updatePrice("resale", e.target.value)}
          required
        />
      </div>
      <div className="form-text">= {formInput.maxResalePriceMATIC} MATIC</div>
      <button
        onClick={addTicket}
        style={{ marginTop: "20px" }}
        className="btn btn-primary"
      >
        Create Tickets
      </button>
      <div>
        <p className="display-6 text-red">{err}</p>
      </div>
    </div>
  );
}
