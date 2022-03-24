import { ethers } from "ethers";
import { useState } from "react";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { useRouter } from "next/router"; //allows us to programatically route to different routes and read values off of route uri
import Web3Modal from "web3modal";

const client = "https://ipfs.infura.io:5001/api/v0"; //a url we can use that sets and pins items to ipfs

import { nftaddress, nftmarketaddress } from "../../config";

import NFT from "../../artifacts/contracts/NFTTicket.sol/NFTTicket.json";
import Market from "../../artifacts/contracts/TicketMarket.sol/TicketMarket.json";

export default function createEvent() {
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, updateFormInput] = useState({
    name: "",
    description: "",
    location: "",
    eventDate: "",
  });
  const router = useRouter();

  //onChange is going to be invoked with an event e
  async function onChange(e) {
    /* upload image to IPFS */
    //taking first file out of array
    const eventPic = e.target.files[0];
    try {
      const added = await client.add(eventPic, {
        progress: (prog) => console.log(`received: ${prog}`),
      });
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      setFileUrl(url);
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  }

  async function uploadToIPFS() {
    const { name, description, location, eventDate } = formInput;
    if (!name || !description || !location || !fileUrl || eventDate) return;
    //TODO - Make fileURL upload optional, add validation checking for fields
    /* first, upload metadata to IPFS */
    const data = JSON.stringify({
      name,
      description,
      image: fileUrl,
      location,
      eventDate,
    });
    try {
      const added = await client.add(data);
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      /* after metadata is uploaded to IPFS, return the URL to use it in the transaction */
      return url;
    } catch (error) {
      console.log("Error uploading file: line 58", error);
    }
  }

  async function addEvent() {
    const url = await uploadToIPFS();
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    /* create the event   */
    const marketContract = new ethers.Contract(
      nftmarketaddress,
      Market.abi,
      signer
    );
    //let listingPrice = await marketContract.getListingPrice()
    //listingPrice = listingPrice.toString()
    const transaction = await marketContract.createToken(url, price, {
      value: listingPrice,
    });
    let tx = await transaction.wait();
    let event = tx.events[0];
    let eventId = event.args.eventId.toNumber();

    //TODO - Find a way to calculate creating an event, this will be by having a listing fee which is the same price as the cost to list on blockchain
    router.push("/");
  }
  return (
    <div>
      <h1>Create Event Page</h1>
      <div className="flex justify-center">
        <div className="w-1/2 flex flex-col pb-12">
          <input
            placeholder="Event Name"
            className="mt-8 border rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, name: e.target.value })
            }
          />
          <textarea
            placeholder="Event Description"
            className="mt-2 border rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, description: e.target.value })
            }
          />
          <input
            placeholder="Event Location"
            className="mt-2 border rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, location: e.target.value })
            }
          />
          <input
            placeholder="Event Start Date"
            className="mt-2 border rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, eventDate: e.target.value })
            }
          />
          <input
            type="file"
            name="Asset"
            className="my-4"
            onChange={onChange}
          />
          {fileUrl && (
            <img className="rounded mt-4" width="350" src={fileUrl} />
          )}
          <button
            onClick={addEvent}
            className="font-bold mt-4 bg-blue-500 text-white rounded p-4 shadow-lg"
          >
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
}
