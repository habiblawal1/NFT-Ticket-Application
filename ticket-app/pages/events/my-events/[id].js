import Link from "next/link";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";

import {
  signers,
  tokenContract,
  marketContract,
} from "../../../components/contracts";
import { nftmarketaddress, nftaddress } from "../../../config";
import PoundPrice from "../../../components/price/Pound";

export default function adminEvent() {
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loadingState, setLoadingState] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();
  const eventId = router.query["id"];

  useEffect(() => {
    if (!router.isReady) return;
    loadData();
  }, [router.isReady]);

  async function loadData() {
    const success = await loadEvent();
    if (success) {
      await loadTickets();
    }
    setLoadingState(true);
  } //TODO - Will show theres tickets tickets supplied and remaining but then won't show that there's any ticketts left in marketplace
  async function loadEvent() {
    try {
      if (!Number.isInteger(parseInt(eventId))) {
        throw new Error(`Event ID '${eventId}' is not valid`);
      }

      const contracts = await signers();
      const { signer, signedMarketContract } = contracts;
      const address = await signer.getAddress();

      const data = await signedMarketContract.getEvent(eventId);
      if (data.owner != address) {
        console.log(data.owner);
        console.log(address);
        throw new Error(`You do not not own the Event ID #${eventId}`);
      }
      const eventUri = await data.uri;
      if (!eventUri) {
        throw new Error("Could not find Event URI");
      }
      console.log("URI = ", eventUri);
      const eventRequest = await axios.get(eventUri);
      const eventData = eventRequest.data;

      //console.log("EVENT DATA = ", eventData);
      const currEvent = {
        eventId: data.eventId.toNumber(),
        name: eventData.name,
        description: eventData.description,
        imageUri: eventData.image,
        location: eventData.location,
        startDate: eventData.eventDate,
      };
      console.log("Event: ", currEvent);
      setEvent(currEvent);
      return true;
    } catch (error) {
      console.log(error);
      error.data === undefined
        ? setErr(error.message)
        : setErr(error.data.message);
      return false;
    }
  }

  async function loadTickets() {
    try {
      const data = await marketContract.getEventTickets(eventId);
      const eventTickets = await Promise.all(
        data.map(async (i) => {
          const tokenId = i.tokenId.toNumber();
          const tokenUri = await tokenContract.uri(tokenId);
          const ticketRequest = await axios.get(tokenUri);
          const ticketData = ticketRequest.data;

          let price = ethers.utils.formatUnits(i.price.toString(), "ether");
          let gbpPrice = await PoundPrice(price);
          let maxResalePrice = ticketData.properties.maxResalePrice;
          let maxResalePriceGBP = await PoundPrice(maxResalePrice);
          let qty = await tokenContract.balanceOf(nftmarketaddress, tokenId);
          let supply = i.totalSupply.toNumber();
          let _ticket = {
            tokenId,
            name: ticketData.name,
            description: ticketData.description,
            price,
            gbpPrice,
            limit: i.purchaseLimit.toNumber(),
            royaltyFee: ticketData.properties.royaltyFee,
            maxResalePrice,
            maxResalePriceGBP,
            supply,
            remaining: qty.toNumber(),
            add: 0,
          };
          return _ticket;
        })
      );
      console.log("Tickets: ", eventTickets);
      setTickets(eventTickets);
    } catch (error) {
      console.log(error);
      error.data === undefined
        ? setErr(error.message)
        : setErr(error.data.message);
    }
  }

  async function addTickets(id, qty) {
    setLoadingState(false);
    try {
      const contracts = await signers();
      const { signedMarketContract, signedTokenContract } = contracts;

      const mintTokensTransaction = await signedTokenContract.addTokens(
        id,
        qty
      );
      await mintTokensTransaction.wait();

      const addTokenToMarketTransaction =
        await signedMarketContract.addMoreTicketsToMarket(nftaddress, id, qty);
      await addTokenToMarketTransaction.wait();
      router.reload();
    } catch (error) {
      console.log(error);
      error.data === undefined
        ? setErr(error.message)
        : setErr(error.data.message);
    }
    setLoadingState(true);
  }

  if (!loadingState) {
    return (
      <div className="container">
        <h1 className="display-1">Loading...</h1>
      </div>
    );
  }

  if (err) {
    return (
      <div className="container">
        <p className="text-red display-6">{err}</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: "1600px" }}>
        <h1>View Admin Details about Event {eventId}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <div
            key={event.eventId}
            className="border shadow rounded-l overflow-hidden"
          >
            <img src={event.imageUri} />

            <div className="p-4">
              <p style={{ height: "64px" }} className="text-3xl font-semibold">
                {event.name}
              </p>
            </div>
            <div className="p-4">
              <p style={{ height: "64px" }} className="text-3xl font-semibold">
                Id: {event.eventId}
              </p>
            </div>
            <div style={{ height: "70px", overflow: "hidden" }}>
              <p style={{ height: "64px" }} className="text-3xl font-semibold">
                Description: {event.description}
              </p>
            </div>
            <div className="p-4">
              <p style={{ height: "64px" }} className="text-3xl font-semibold">
                Date: {event.startDate}
              </p>
            </div>
            <div style={{ height: "70px", overflow: "hidden" }}>
              <p style={{ height: "64px" }} className="text-3xl font-semibold">
                Location: {event.location}
              </p>
            </div>
            <div className="p-4">
              <p
                style={{ height: "64px" }}
                className="text-primary font-semibold"
              >
                <Link href={`/events/validate/${event.eventId}`}>
                  <a className="mr-6">Validate Tickets -&gt;</a>
                </Link>
              </p>
            </div>
          </div>
        </div>

        <h1>Tickets</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <div
                key={ticket.tokenId}
                className="border shadow rounded-l overflow-hidden"
              >
                <div className="p-4">
                  <p
                    style={{ height: "64px" }}
                    className="text-3xl font-semibold"
                  >
                    Ticket: {`#${ticket.tokenId}: ${ticket.name}`}
                  </p>
                </div>
                <div className="p-4">
                  <p
                    style={{ height: "64px" }}
                    className="text-3xl font-semibold"
                  >
                    Description: {ticket.description}
                  </p>
                </div>
                <div style={{ height: "70px", overflow: "hidden" }}>
                  <p
                    style={{ height: "64px" }}
                    className="text-3xl font-semibold"
                  >
                    Price: £{ticket.gbpPrice}
                  </p>
                </div>
                <div style={{ height: "70px", overflow: "hidden" }}>
                  <p className="text-3xl">= {ticket.price} MATIC</p>
                </div>
                <div style={{ height: "70px", overflow: "hidden" }}>
                  <p
                    style={{ height: "64px" }}
                    className="text-3xl font-semibold"
                  >
                    Purchase Limit: {ticket.limit}
                  </p>
                </div>
                <div style={{ height: "70px", overflow: "hidden" }}>
                  <p
                    style={{ height: "64px" }}
                    className="text-3xl font-semibold"
                  >
                    Royalty Fee: {ticket.royaltyFee}%
                  </p>
                </div>
                <div style={{ height: "70px", overflow: "hidden" }}>
                  <p
                    style={{ height: "64px" }}
                    className="text-3xl font-semibold"
                  >
                    Max Resale Price: £{ticket.maxResalePriceGBP}
                  </p>
                </div>
                <div style={{ height: "70px", overflow: "hidden" }}>
                  <p className="text-3xl">= {ticket.maxResalePrice} MATIC</p>
                </div>
                <div className="p-4">
                  <p
                    style={{ height: "64px" }}
                    className="text-black-500 font-semibold"
                  >
                    Tickets Supplied: {ticket.supply}
                  </p>
                </div>
                <div className="p-4">
                  <p
                    style={{ height: "64px" }}
                    className="text-green font-semibold"
                  >
                    Tickets Remaining: {ticket.remaining}
                  </p>
                </div>
                <div>
                  <label>
                    Add More
                    <input
                      placeholder="Quantity"
                      className="mt-4 border rounded p-4"
                      onChange={(e) => (ticket.add = e.target.value)}
                    />
                  </label>
                </div>
                <button
                  onClick={() => {
                    ticket.add > 0
                      ? addTickets(ticket.tokenId, ticket.add)
                      : alert("Please select quantity");
                  }}
                  className="font-bold mt-4 bg-primary text-white rounded p-4 shadow-lg"
                >
                  Add Ticket
                </button>
              </div>
            ))
          ) : (
            <h1 className="px-20 py-10 text-3xl">
              No Tickets currently for this event
            </h1>
          )}
        </div>
        <button
          onClick={() => {
            router.push("/tickets/create");
          }}
          className="font-bold mt-4 bg-primary text-white rounded p-4 shadow-lg"
        >
          Create Tickets
        </button>
      </div>
    </div>
  );
}
