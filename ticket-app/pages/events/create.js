import { ethers } from "ethers";
import { useState } from "react";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { useRouter } from "next/router"; //allows us to programatically route to different routes and read values off of route uri
import Web3Modal from "web3modal";

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0"); //a url we can use that sets and pins items to ipfs

import { nftaddress, nftmarketaddress } from "../../config";

import NFT from "../../artifacts/contracts/NFTTicket.sol/NFTTicket.json";
import Market from "../../artifacts/contracts/TicketMarket.sol/TicketMarket.json";

export default function createEvent() {
  //const [fileUrl, setFileUrl] = useState(null);
  const [eventPic, setEventPic] = useState(null);
  const [err, setErr] = useState([]);
  const [eventDate, setEventDate] = useState(new Date());
  const [formInput, updateFormInput] = useState({
    name: "",
    description: "",
    category: "",
    location: "",
  });
  const router = useRouter();

  async function uploadToPictureToIPFS() {
    //TODO - If no file is added, then use placeholder picture instead
    //Upload Event Picture
    try {
      const added = await client.add(eventPic, {
        progress: (prog) => console.log(`received: ${prog}`),
      });
      return `https://ipfs.infura.io/ipfs/${added.path}`;
    } catch (error) {
      setErr((oldErr) => [...oldErr, error.message]);
      console.log(err);
    }
  }

  async function uploadToIPFS() {
    const { name, description, category, location } = formInput;
    if (!name || !description || !category || !location || !eventDate) {
      throw new Error("Please check you have completed all fields");
    }

    const fileUrl = await uploadToPictureToIPFS();
    //TODO - Make fileURL upload optional, add validation checking for fields
    //TODO - Form validation for location and deciding format to store location (e.g. maybe as a json object with city, postcode etc.)
    /* first, upload metadata to IPFS */
    const data = JSON.stringify({
      name,
      description,
      category,
      image: fileUrl,
      location,
      eventDate: new Date(eventDate).toLocaleDateString(),
    });

    try {
      const added = await client.add(data);
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      /* after metadata is uploaded to IPFS, return the URL to use it in the transaction */
      console.log("EVENT URL = ", url);
      return url;
    } catch (error) {
      setErr((oldErr) => [...oldErr, error.message]);
      console.log("Error uploading file: line 58", error);
    }
  }

  async function addEvent() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    /* create the event  */
    const marketContract = new ethers.Contract(
      nftmarketaddress,
      Market.abi,
      signer
    );

    try {
      const url = await uploadToIPFS();
      const transaction = await marketContract.createEvent(
        url,
        Math.floor(new Date(eventDate).getTime() / 1000)
      );
      let tx = await transaction.wait();
      let event = tx.events[0];
      let eventId = event.args.eventId.toNumber();
      //await marketContract.setEventUri(eventId, url);

      //TODO - Find a way to calculate price of creating an event, this will be by having a listing fee which is the same price as the cost to list on blockchain
      router.push("/events");
      //router.push("/events/my-events");
    } catch (error) {
      setErr((oldErr) => [...oldErr, "Check console for new error with ETH"]);
      console.log(error);
    }
  }

  return (
    <div>
      <h1>Create Event Page</h1>
      <div className="flex justify-center">
        <div className="w-1/2 flex flex-col pb-12">
          <input
            placeholder="Event Name"
            className="mt-4 border rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, name: e.target.value })
            }
          />
          <textarea
            placeholder="Event Description"
            className="mt-4 border rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, description: e.target.value })
            }
          />
          <input
            placeholder="Event Category"
            className="mt-4 border rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, category: e.target.value })
            }
          />
          <p className="mt-4">Start Date:</p>
          <div className="mt-1 border rounded p-4">
            <DatePicker
              selected={eventDate}
              onChange={(date) => setEventDate(date)}
            />
          </div>
          <input
            placeholder="Event Location"
            className="mt-4 border rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, location: e.target.value })
            }
          />
          <div>
            <label htmlFor="Asset">Event Picture: </label>
            <input
              type="file"
              name="Asset"
              className="my-4"
              onChange={(e) => setEventPic(e.target.files[0])}
            />
          </div>
          {/**If there is a file uploaded then show a preview of it */}
          {eventPic && (
            <img
              className="rounded mt-4"
              width="350"
              src={URL.createObjectURL(eventPic)}
            />
          )}
          <button
            onClick={addEvent}
            className="font-bold mt-4 bg-blue-500 text-white rounded p-4 shadow-lg"
          >
            Create Event
          </button>
          <div>
            {err.map((error) => (
              <p className="mr-6 text-red-500">{error}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
