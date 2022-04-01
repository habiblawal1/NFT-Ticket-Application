import Link from "next/link";
import { useRouter } from "next/router";
import { ethers, providers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";

import { nftaddress, nftmarketaddress } from "../../config";

import NFT from "../../artifacts/contracts/NFTTicket.sol/NFTTicket.json";
import Market from "../../artifacts/contracts/TicketMarket.sol/TicketMarket.json";

export default function eventDetails() {
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loadingState, setLoadingState] = useState("not-loaded");
  const router = useRouter();
  const eventId = router.query["id"];
  useEffect(() => {
    if (!router.isReady) return;
    loadEvent();
    loadTickets();
  }, [router.isReady]);

  const provider = new ethers.providers.JsonRpcProvider();
  const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
  const marketContract = new ethers.Contract(
    nftmarketaddress,
    Market.abi,
    provider
  );

  async function loadEvent() {
    const data = await marketContract.getEvent(eventId);
    const eventUri = await data.uri;
    if (!eventUri) {
      //TODO - Proper error msg for no URI
      let currEvent = {
        eventId: "NO EVENT URI",
        name: "NO EVENT URI",
        description: "NO EVENT URI",
        category: "NO EVENT URI",
        imageUri: "NO EVENT URI",
        location: "NO EVENT URI",
        startDate: "NO EVENT URI",
        owner: "NO EVENT URI",
      };
      return currEvent;
    }
    console.log("URI = ", eventUri);
    const eventRequest = await axios.get(eventUri);
    const eventData = eventRequest.data;

    //console.log("EVENT DATA = ", eventData);
    const currEvent = {
      eventId: data.eventId.toNumber(),
      name: eventData.name,
      description: eventData.description,
      category: eventData.category,
      imageUri: eventData.image,
      location: eventData.location,
      startDate: eventData.eventDate,
      owner: data.owner,
    };
    console.log("Event: ", currEvent);
    setEvent(currEvent);
  }

  async function loadTickets() {
    const data = await marketContract.getEventTickets(eventId);
    const eventTickets = await Promise.all(
      data.map(async (i) => {
        const tokenId = i.tokenId.toNumber();
        const tokenUri = await tokenContract.uri(tokenId);
        const ticketRequest = await axios.get(tokenUri);
        const ticketData = ticketRequest.data;
        console.log(ticketData);
        let price = ethers.utils.formatUnits(i.price.toString(), "ether");
        let _ticket = {
          tokenId,
          name: ticketData.name,
          description: ticketData.description,
          price: `${price} MATIC`,
        };
        return _ticket;
      })
    );
    console.log("Tickets: ", eventTickets);
    setTickets(eventTickets);
    setLoadingState("loaded");
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
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  Category: {event.category}
                </p>
              </div>
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-blue-500 font-semibold"
                >
                  <Link href="/tickets/create">
                    <a className="mr-6">Create Ticket For Event</a>
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

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
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  Category: {event.category}
                </p>
              </div>
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-blue-500 font-semibold"
                >
                  <Link href="/tickets/create">
                    <a className="mr-6">Create Ticket For Event</a>
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
