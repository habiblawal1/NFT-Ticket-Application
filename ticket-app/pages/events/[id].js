import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";

import PoundPrice from "../../components/price/Pound";

import { nftaddress, nftmarketaddress } from "../../config";

import {
  signers,
  tokenContract,
  marketContract,
} from "../../components/contracts";

export default function eventDetails() {
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
    await loadEvent();
    !err && (await loadTickets());
  }

  async function loadEvent() {
    try {
      const data = await marketContract.getEvent(eventId);
      const eventUri = await data.uri;
      if (!eventUri) {
        setErr(`Could not find URI for the Event ID #${eventId}`);
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
        owner: data.owner,
      };
      console.log("Event: ", currEvent);
      setEvent(currEvent);
    } catch (error) {
      console.error(error);
      setErr("Error fetching event, see console for details");
    }
  }

  async function loadTickets() {
    const contract = await signers();
    const { signer } = contract;
    try {
      const address = await signer.getAddress();
      const data = await marketContract.getEventTickets(eventId);
      const eventTickets = await Promise.all(
        data.map(async (i) => {
          const tokenId = i.tokenId.toNumber();
          const tokenUri = await tokenContract.uri(tokenId);
          const ticketRequest = await axios.get(tokenUri);
          const ticketData = ticketRequest.data;

          const resaleTickets = await marketContract.getResaleTickets(tokenId);
          let resaleAvail;
          resaleTickets.length > 0
            ? (resaleAvail = true)
            : (resaleAvail = false);
          let price = ethers.utils.formatUnits(i.price.toString(), "ether");
          let gbpPrice = await PoundPrice(price);
          console.log("In Pounds", gbpPrice);
          let qty = await tokenContract.balanceOf(nftmarketaddress, tokenId);
          let myQty = await tokenContract.balanceOf(address, tokenId);
          let _ticket = {
            tokenId,
            name: ticketData.name,
            description: ticketData.description,
            price,
            gbpPrice,
            limit: i.purchaseLimit.toNumber(),
            quantity: qty.toNumber(),
            resaleAvail,
            buyQty: 0,
            myQty,
          };
          return _ticket;
        })
      );
      setTickets(eventTickets);
      setLoadingState(true);
    } catch (error) {
      console.error(error);
      setErr("Error loading the event's tickets, see console for details");
    }
  }

  async function buyTicket(id, price, qty) {
    const signedContracts = await signers();
    const { signedMarketContract } = signedContracts;
    /* needs the user to sign the transaction, so will use Web3Provider and sign it */
    /* user will be prompted to pay the asking proces to complete the transaction */
    try {
      const ticketPrice = ethers.utils.parseUnits(price, "ether");
      const transaction = await signedMarketContract.buyTicket(
        nftaddress,
        id,
        qty,
        {
          value: ticketPrice.mul(qty),
        }
      );
      await transaction.wait();
      router.push("/tickets");
    } catch (error) {
      console.error(error);
      setErr("Error loading the buying tickets, see console for details");
    }
  }

  if (!loadingState) {
    return <h1 className="px-20 display-1">Loading...</h1>;
  }

  if (err) {
    return <p className="text-red display-6">{err}</p>;
  }
  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: "1600px" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {event && (
            <div
              key={event.eventId}
              className="border shadow rounded-l overflow-hidden"
            >
              <img src={event.imageUri} />

              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  Name: {event.name}
                </p>
              </div>
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  Id: {event.eventId}
                </p>
              </div>
              <div style={{ height: "70px", overflow: "hidden" }}>
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  Description: {event.description}
                </p>
              </div>
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  Date: {event.startDate}
                </p>
              </div>
              <div style={{ height: "70px", overflow: "hidden" }}>
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  Location: {event.location}
                </p>
              </div>
            </div>
          )}
        </div>

        <h1>Tickets</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {tickets.length > 0 &&
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
                    Ticket: {`#${ticket.tokenId} ${ticket.name}`}
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
                {ticket.quantity > 1 ? (
                  <>
                    <div>
                      <label>
                        Qty: (Max=
                        {Math.min(ticket.quantity, ticket.limit - ticket.myQty)}
                        )
                        <input
                          placeholder="Quantity"
                          className="mt-4 border rounded p-4"
                          onChange={(e) => (ticket.buyQty = e.target.value)}
                        />
                      </label>
                    </div>
                    <button
                      onClick={() => {
                        ticket.buyQty > 0
                          ? buyTicket(
                              ticket.tokenId,
                              ticket.price,
                              ticket.buyQty
                            )
                          : alert("Please select quantity");
                      }}
                      className="font-bold mt-4 bg-primary text-white rounded p-4 shadow-lg"
                    >
                      Buy Ticket
                    </button>
                    {ticket.resaleAvail && (
                      <div className="p-4">
                        <p
                          style={{ height: "64px" }}
                          className="text-primary font-semibold"
                        >
                          <Link href={`/resale/${ticket.tokenId}`}>
                            <a className="mr-6">Available on resale -&gt;</a>
                          </Link>
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <h1>SOLD OUT</h1>
                )}
              </div>
            ))}
          {tickets.length < 1 && (
            <h1 className="px-20 py-10 text-3xl">
              No Tickets currently for this event
            </h1>
          )}
        </div>
      </div>
    </div>
  );
}
