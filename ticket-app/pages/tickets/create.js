import { ethers } from "ethers";
import { useState } from "react";
import { NFTStorage } from "nft.storage";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { useRouter } from "next/router"; //allows us to programatically route to different routes and read values off of route uri
import Web3Modal from "web3modal";

//const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0"); //a url we can use that sets and pins items to ipfs
//TODO - Add as envVar
const API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDk1Qjg1NDdDNzdEMTQzNUU3M2QxQUEzNDc1OTg5ZDMyNGMwOTAwYjciLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY0ODA3OTA5MTQ5OCwibmFtZSI6Ik5GVF9UaWNrZXRfQXBwIn0.1YjFxXNgTt5C89JOSSLCJfWphe22EYU8GcPQlodG8no";
const ticketPlaceholderUrl =
  "ipfs://bafkreibmj25canr2btdofjrek7djq4ghn5nwzhlh5t2uf2n6ad4nved4la";
const client = new NFTStorage({ token: API_KEY });

import { nftaddress, nftmarketaddress } from "../../config";

import NFT from "../../artifacts/contracts/NFTTicket.sol/NFTTicket.json";
import Market from "../../artifacts/contracts/TicketMarket.sol/TicketMarket.json";

export default function createTicket() {
  const [err, setErr] = useState([]);
  const [formInput, updateFormInput] = useState({
    eventId: "",
    name: "",
    description: "",
    price: "",
    purchaseLimit: "",
    amount: "",
  });
  const router = useRouter();
  url: "ipfs://bafyreih6tmlwwzkphuhenrby6diek3oke6xxphvzxaq4bijtlex2gyfliq/metadata.json";

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
    const { eventId, name, description, price, purchaseLimit, amount } =
      formInput;
    if (!name || !eventId || !price || !amount || !purchaseLimit) {
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
        price,
        eventId,
        purchaseLimit,
      },
    };
    const metadata = await client.store(data);
    const url = `https://ipfs.io/ipfs/${metadata.ipnft}/metadata.json`;
    console.log("Metadata URL: ", url);
    return url;
  }

  async function addTicket() {
    const { eventId, price, purchaseLimit, amount } = formInput;
    //TODO - Add error check for if ticket creater matches event owner
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const marketContract = new ethers.Contract(
      nftmarketaddress,
      Market.abi,
      signer
    );
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, signer);

    try {
      const url = await uploadToIPFS();
      const ticketPrice = ethers.utils.parseUnits(price, "ether");

      let nftTransaction = await tokenContract.createToken(amount);
      let tokenId = -1;
      let nftTx = await nftTransaction.wait();
      nftTx.events.forEach((element) => {
        if (element.event == "NFTTicketCreated") {
          tokenId = element.args.tokenId.toNumber();
        }
      });
      console.log("Token ID = ", tokenId);
      nftTransaction = await tokenContract.setTokenUri(tokenId, url);
      nftTx = await nftTransaction.wait();

      //TODO - User has to sign making token, setting uri, and creating market ticket, find a way so that a user only needs to do it once
      //TODO - Don't allow user to click the button twice, disable it after having it clicked once otherwise you accidently create multiple tokens
      /**
      uint256 eventId,
      uint256 tokenId,
      address nftContract,
      uint256 purchaseLimit,
      uint256 totalSupply,
      uint256 price
       */
      const marketTransaction = await marketContract.createMarketTicket(
        eventId,
        tokenId,
        tokenContract.address,
        purchaseLimit,
        amount,
        ticketPrice
      );
      await marketTransaction.wait();

      router.push("/events/my-events");
    } catch (error) {
      setErr((oldErr) => [...oldErr, "Check console for new error with ETH"]);
      console.log(error);
    }
  }

  return (
    <div>
      <h1>Create Tickets Page</h1>
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
          <input
            placeholder="Event Id"
            className="mt-4 border rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, eventId: e.target.value })
            }
          />
          {/** TODO - Add conversion for MATIC to GBP*/}
          {/** TODO - Declare which fields are required*/}
          <input
            placeholder="Ticket Price (MATIC)"
            className="mt-4 border rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, price: e.target.value })
            }
          />
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
          <button
            onClick={addTicket}
            className="font-bold mt-4 bg-blue-500 text-white rounded p-4 shadow-lg"
          >
            Create Ticket
          </button>
          <div>
            {err.map((error) => (
              <p key={error} className="mr-6 text-red-500">
                {error}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
