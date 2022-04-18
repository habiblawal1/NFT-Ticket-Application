import { useRouter } from "next/router";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";

import PoundPrice from "../../components/price/Pound";

import {
  marketContract,
  tokenContract,
  signers,
} from "../../components/contracts";

export default function eventResaleListings() {
  const [event, setEvent] = useState();
  const [ticket, setTicket] = useState();
  const [resaleTickets, setResaleTickets] = useState([]);
  const [loadingState, setLoadingState] = useState(false);
  const [err, setErr] = useState("");

  const router = useRouter();
  const tokenId = router.query["id"];
  useEffect(() => {
    if (!router.isReady) return;
    loadData();
  }, [router.isReady]);

  async function loadData() {
    if (!Number.isInteger(parseInt(tokenId))) {
      setErr(`Token ID '${tokenId}' is not valid`);
    } else {
      await loadEvent();
      await loadResaleTickets();
    }
    setLoadingState(true);
  }

  async function loadEvent() {
    try {
      const ticketUri = await tokenContract.uri(tokenId);
      console.log("Ticket URI: ", ticketUri);
      const ticketRequest = await axios.get(ticketUri);
      const ticketData = ticketRequest.data;

      let eventId = ticketData.properties.eventId;
      const thisEvent = await marketContract.getEvent(eventId);

      const eventUri = thisEvent.uri;
      console.log("Event URI: ", eventUri);
      const eventRequest = await axios.get(eventUri);
      const eventData = eventRequest.data;

      console.log("EVENT DATA = ", eventData);
      const currEvent = {
        eventId,
        name: eventData.name,
        imageUri: eventData.image,
      };
      const currTicket = {
        tokenId,
        name: ticketData.name,
        description: ticketData.description,
      };
      console.log("Event: ", currEvent);
      console.log("Ticket: ", currTicket);
      setEvent(currEvent);
      setTicket(currTicket);
    } catch (error) {
      console.log(error);
      error.data === undefined
        ? setErr(error.message)
        : setErr(error.data.message);
    }
  }

  async function loadResaleTickets() {
    try {
      const data = await marketContract.getResaleTickets(tokenId);
      const tickets = await Promise.all(
        data.map(async (i) => {
          let price = ethers.utils.formatUnits(
            i.resalePrice.toString(),
            "ether"
          );
          let gbpPrice = await PoundPrice(price);
          let _ticket = {
            resaleId: i.resaleId.toNumber(),
            seller: i.seller,
            price,
            gbpPrice,
          };
          return _ticket;
        })
      );
      console.log("Resale Tickets: ", tickets);
      setResaleTickets(tickets);
    } catch (error) {
      console.log(error);
      error.data === undefined
        ? setErr(error.message)
        : setErr(error.data.message);
    }
  }

  async function buyTicket(resaleId, price) {
    try {
      setLoadingState(false);
      const signedContracts = await signers();
      const { signedMarketContract } = signedContracts;

      const ticketPrice = ethers.utils.parseUnits(price, "ether");
      const transaction = await signedMarketContract.buyResaleTicket(
        nftaddress,
        resaleId,
        {
          value: ticketPrice,
        }
      );
      await transaction.wait();
      setLoadingState(true);
      //TODO - You don't redericted
      router.push("/tickets");
    } catch (error) {
      console.log(error);
      error.data === undefined
        ? setErr(error.message)
        : setErr(error.data.message);
    }
    setLoadingState(true);
  }

  if (!loadingState) {
    return <h1 className="container display-1">Loading...</h1>;
  }
  if (err) {
    return <p className="container text-red display-6">{err}</p>;
  }
  if (!resaleTickets.length) {
    return (
      <h1 className="container text-center display-6">
        No resale tickets available for the Ticket ID: {tokenId}"
      </h1>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: "1600px" }}>
        <h1>Resale Tickets available for Ticket: #{tokenId}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <div
            key={event.eventId}
            className="border shadow rounded-l overflow-hidden"
          >
            <div className="p-4">
              <p style={{ height: "64px" }} className="text-3xl font-semibold">
                Event: {event.name} - #{event.eventId}
              </p>
            </div>
            <img src={event.imageUri} />

            <div className="p-4">
              <p style={{ height: "64px" }} className="text-3xl font-semibold">
                Ticket: {ticket.name} - #{ticket.tokenId}
              </p>
            </div>
            {ticket.description && (
              <div style={{ height: "70px", overflow: "hidden" }}>
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  Description: {ticket.description}
                </p>
              </div>
            )}
          </div>
        </div>

        <h1>Tickets</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {resaleTickets.map((_ticket) => (
            <div
              key={_ticket.resaleId}
              className="border shadow rounded-l overflow-hidden"
            >
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  Seller: {_ticket.seller}
                </p>
              </div>
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  List Price: £{_ticket.gbpPrice}
                </p>
              </div>
              <div style={{ height: "70px", overflow: "hidden" }}>
                <p className="text-3xl">= {_ticket.price} MATIC</p>
              </div>

              <button
                onClick={() => {
                  buyTicket(_ticket.resaleId, _ticket.price);
                }}
                className="font-bold mt-4 bg-primary text-white rounded p-4 shadow-lg"
              >
                Buy Ticket
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
