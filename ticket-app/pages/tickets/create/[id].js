import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { NFTStorage } from "nft.storage";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { useRouter } from "next/router"; //allows us to programatically route to different routes and read values off of route uri
import axios from "axios";

import MaticPrice from "../../../components/price/Matic";

const client = new NFTStorage({
  token: process.env.NEXT_PUBLIC_NFT_STORAGE_TOKEN,
});

import { signers } from "../../../components/contracts";

export default function createTicket() {
  const [err, setErr] = useState([]);
  const [formInput, updateFormInput] = useState({
    name: "",
    description: "",
    price: "",
    priceMATIC: "",
    purchaseLimit: "",
    amount: "",
    royaltyFee: "",
    maxResalePrice: "",
    maxResalePriceMATIC: "",
  });
  const [eventName, setEventName] = useState("");
  const router = useRouter();
  const eventId = router.query["id"];
  // url: "ipfs://bafyreih6tmlwwzkphuhenrby6diek3oke6xxphvzxaq4bijtlex2gyfliq/metadata.json";

  useEffect(() => {
    if (!router.isReady) return;
    loadData();
  }, [router.isReady]);

  async function loadData() {
    const contracts = await signers();
    const { signedMarketContract, signer } = contracts;
    let eventData = "";
    try {
      const data = await signedMarketContract.getEvent(eventId);
      const eventUri = await data.uri;
      const address = await signer.getAddress();
      if (!eventUri) {
        setErr((oldErr) => [...oldErr, "Could not find Event URI"]);
      } else if (data.owner != address) {
        console.log();
        setErr((oldErr) => [
          ...oldErr,
          "You do not own the event that you are trying to create a ticket for",
        ]);
      }
      const eventRequest = await axios.get(eventUri);
      eventData = eventRequest.data;
      setEventName(eventData.name);
    } catch (error) {
      setErr((oldErr) => [...oldErr, error.data.message]);
      console.log(error);
    }
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
    const image = await getPlaceholderImage();

    //TODO - Form validation
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
    //TODO - Add error check for if ticket creater matches event owner
    const contracts = await signers();
    const { signedMarketContract, signedTokenContract } = contracts;

    try {
      const url = await uploadToIPFS();
      const ticketPrice = ethers.utils.parseUnits(priceMATIC, "ether");
      const resalePrice = ethers.utils.parseUnits(maxResalePriceMATIC, "ether");

      let nftTransaction = await signedTokenContract.createToken(amount);
      let tokenId = -1;
      let nftTx = await nftTransaction.wait();
      nftTx.events.forEach((element) => {
        if (element.event == "NFTTicketCreated") {
          tokenId = element.args.tokenId.toNumber();
        }
      });
      console.log("Token ID = ", tokenId);
      nftTransaction = await signedTokenContract.setTokenUri(tokenId, url);
      nftTx = await nftTransaction.wait();

      //TODO - Redirect people to page
      //TODO - User has to sign making token, setting uri, and creating market ticket, find a way so that a user only needs to do it once
      //TODO - Don't allow user to click the button twice, disable it after having it clicked once otherwise you accidently create multiple tokens
      //TODO - Auto fill event ID and name
      /**
    uint256 eventId,
    uint256 tokenId,
    address nftContract,
    uint256 purchaseLimit,
    uint256 totalSupply,
    uint256 price,
    uint256 royaltyFee,
    uint256 maxResalePrice
       */
      const marketTransaction = await signedMarketContract.createMarketTicket(
        eventId,
        tokenId,
        signedTokenContract.address,
        purchaseLimit,
        amount,
        ticketPrice,
        royaltyFee,
        resalePrice
      );
      await marketTransaction.wait();

      router.push("/events/my-events");
    } catch (error) {
      setErr((oldErr) => [...oldErr, err.data.message]);
      console.log(error);
    }
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

  return (
    <div>
      <h1>Create Tickets Page</h1>
      <div className="flex justify-center">
        <p style={{ height: "64px" }} className="text-3xl">
          <span className="text-primary font-semibold">{eventName}</span> - #
          {eventId}
        </p>
      </div>
      <div className="flex justify-center">
        <div className="w-1/2 flex flex-col pb-12">
          <input
            placeholder="Ticket Name"
            className="mt-4 border rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, name: e.target.value })
            }
          />
          <textarea
            placeholder="Ticket Description"
            className="mt-4 border rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, description: e.target.value })
            }
          />
          {/** TODO - Declare which fields are required*/}
          <input
            placeholder="Ticket Price (GBP)"
            className="mt-4 border rounded p-4"
            onChange={(e) => {
              updatePrice("ticket", e.target.value);
            }}
          />

          <p> = {formInput.priceMATIC} MATIC</p>
          <input
            placeholder="Maximum tickets a user can purchase at once"
            className="mt-4 border rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, purchaseLimit: e.target.value })
            }
          />
          <input
            placeholder="Number of tickets"
            className="mt-4 border rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, amount: e.target.value })
            }
          />
          <input
            placeholder="Royalty fee (%)"
            className="mt-4 border rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, royaltyFee: e.target.value })
            }
          />
          <input
            placeholder="Maximum Resale Price (GBP)"
            className="mt-4 border rounded p-4"
            onChange={(e) => updatePrice("resale", e.target.value)}
          />
          <p>= {formInput.maxResalePriceMATIC} MATIC</p>
          <button
            onClick={addTicket}
            className="font-bold mt-4 bg-primary text-white rounded p-4 shadow-lg"
          >
            Create Ticket
          </button>
          <div>
            {err.map((error) => (
              <p key={error} className="mr-6 text-red">
                {error}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
