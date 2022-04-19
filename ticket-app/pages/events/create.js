import { useState } from "react";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { useRouter } from "next/router"; //allows us to programatically route to different routes and read values off of route uri

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0"); //a url we can use that sets and pins items to ipfs

import { signers } from "../../components/contracts";

export default function createEvent() {
  const [loadingState, setLoadingState] = useState(true);
  const [eventPic, setEventPic] = useState(null);
  const [err, setErr] = useState("");
  const [eventDate, setEventDate] = useState(formatDate(Date.now()));
  const [formInput, updateFormInput] = useState({
    name: "",
    description: "",
    address: "",
    postcode: "",
  });
  const router = useRouter();

  function formatDate(date) {
    const oldDate = new Date(date);
    const newDate =
      oldDate.getFullYear() +
      "/" +
      (oldDate.getMonth() + 1) +
      "/" +
      oldDate.getDate() +
      ", 23:59:59";
    return new Date(newDate);
  }
  async function uploadToPictureToIPFS() {
    const placeholderUrl =
      "https://ipfs.infura.io/ipfs/QmZcjqFN4iEHSpXU3ou1LLMFNhiP1uXcpBobDJFgHfuABP";
    //Upload Event Picture
    if (!eventPic) {
      return placeholderUrl;
    }
    try {
      const added = await client.add(eventPic, {
        progress: (prog) => console.log(`received: ${prog}`),
      });
      return `https://ipfs.infura.io/ipfs/${added.path}`;
    } catch (error) {
      console.log(error);
      error.data === undefined
        ? setErr(error.message)
        : setErr(error.data.message);
    }
  }

  async function uploadToIPFS() {
    const { name, description, address, postcode } = formInput;
    if (!name || !description || !address || !postcode || !eventDate) {
      throw new Error("Please check you have completed all fields");
    }

    const fileUrl = await uploadToPictureToIPFS();
    /* first, upload metadata to IPFS */
    const data = JSON.stringify({
      name,
      description,
      image: fileUrl,
      location: `${address}, ${postcode}`,
      eventDate: new Date(eventDate).toLocaleDateString(),
    });

    try {
      const added = await client.add(data);
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      /* after metadata is uploaded to IPFS, return the URL to use it in the transaction */
      console.log("EVENT URL = ", url);
      return url;
    } catch (error) {
      console.log(error);
      error.data === undefined
        ? setErr(error.message)
        : setErr(error.data.message);
    }
  }

  async function addEvent() {
    setLoadingState(false);
    const contracts = await signers();
    const { signedMarketContract } = contracts;
    /* create the event  */
    try {
      formatDate(eventDate);
      const url = await uploadToIPFS();
      const transaction = await signedMarketContract.createEvent(
        url,
        Math.floor(new Date(eventDate).getTime() / 1000)
      );
      await transaction.wait();
      setLoadingState(true);
      router.push("/events/my-events");
    } catch (error) {
      console.log(error);
      error.data === undefined
        ? setErr(error.message)
        : setErr(error.data.message);
      setLoadingState(true);
    }
  }

  if (!loadingState) {
    return <h1 className="container display-1">Loading...</h1>;
  }

  return (
    <div className="container">
      <h1 className="text-center">Create New Event</h1>
      <div className="mb-3">
        <label htmlFor="eventName" className="form-label">
          Event Name
        </label>
        <input
          type="text"
          className="form-control"
          id="eventName"
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
      <label htmlFor="eventDate" className="form-label">
        Start Date
      </label>
      <div className="input-group mb-3">
        <DatePicker
          id="eventDate"
          className="form-control"
          selected={eventDate}
          onChange={(date) => setEventDate(formatDate(date))}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="address" className="form-label">
          Event Address
        </label>
        <input
          type="text"
          className="form-control"
          id="address"
          onChange={(e) =>
            updateFormInput({ ...formInput, address: e.target.value })
          }
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="postcode" className="form-label">
          Event Postcode
        </label>
        <input
          type="text"
          className="form-control"
          id="postcode"
          onChange={(e) =>
            updateFormInput({ ...formInput, postcode: e.target.value })
          }
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="Picture">Event Picture</label>
        <input
          type="file"
          name="Picture"
          className="form-control"
          onChange={(e) => setEventPic(e.target.files[0])}
        />
      </div>
      <div>
        {/**If there is a file uploaded then show a preview of it */}
        {eventPic && (
          <img
            className="rounded mt-4"
            width="350"
            src={URL.createObjectURL(eventPic)}
          />
        )}
      </div>
      <button
        type="submit"
        onClick={addEvent}
        style={{ marginTop: "20px" }}
        className="btn btn-primary"
      >
        Create Event
      </button>
      <div>
        <p className="display-6 text-red">{err}</p>
      </div>
    </div>
  );
}
