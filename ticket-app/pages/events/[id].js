import Link from "next/link";
import { useRouter } from "next/router";
import { ethers, providers } from "ethers";
import { useEffect, useState } from "react";
import Web3Modal from "web3modal";
import axios from "axios";

import { nftaddress, nftmarketaddress } from "../../config";

import NFT from "../../artifacts/contracts/NFTTicket.sol/NFTTicket.json";
import Market from "../../artifacts/contracts/TicketMarket.sol/TicketMarket.json";

export default function eventDetails() {
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [qty, setQty] = useState(0);
  const [loadingState, setLoadingState] = useState("not-loaded");
  const router = useRouter();
  const eventId = router.query["id"];
  useEffect(() => {
    if (!router.isReady) return;
    loadEvent();
    loadTickets();
  }, [router.isReady]);

  async function loadEvent() {
    const provider = new ethers.providers.JsonRpcProvider();
    const marketContract = new ethers.Contract(
      nftmarketaddress,
      Market.abi,
      provider
    );

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
    const provider = new ethers.providers.JsonRpcProvider();
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(
      nftmarketaddress,
      Market.abi,
      provider
    );

    const data = await marketContract.getEventTickets(eventId);
    const eventTickets = await Promise.all(
      data.map(async (i) => {
        const tokenId = i.tokenId.toNumber();
        const tokenUri = await tokenContract.uri(tokenId);
        const ticketRequest = await axios.get(tokenUri);
        const ticketData = ticketRequest.data;
        console.log("ticketdata:", i);
        console.log("LIMIT yo:", i.purchaseLimit.toString());
        let price = ethers.utils.formatUnits(i.price.toString(), "ether");
        let qty = await tokenContract.balanceOf(nftmarketaddress, tokenId);
        let _ticket = {
          tokenId,
          name: ticketData.name,
          description: ticketData.description,
          price,
          limit: ticketData.properties.purchaseLimit,
          quantity: qty.toNumber(),
        };
        return _ticket;
      })
    );
    console.log("Tickets: ", eventTickets);
    setTickets(eventTickets);
    setLoadingState("loaded");
  }

  async function buyTicket(id, price) {
    /* needs the user to sign the transaction, so will use Web3Provider and sign it */
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const marketContract = new ethers.Contract(
      nftmarketaddress,
      Market.abi,
      signer
    );

    //TODO - Edit quantity on front end so it shows max of purchase limit, or tickets remaining
    /* user will be prompted to pay the asking proces to complete the transaction */
    console.log("PRICE, ", price);
    const ticketPrice = ethers.utils.parseUnits(price, "ether");
    const transaction = await marketContract.buyTicket(nftaddress, id, qty, {
      value: ticketPrice.mul(qty),
    });
    await transaction.wait();
    router.push("/tickets");
  }

  if (loadingState === "not-loaded") {
    return <h1 className="px-20 py-10 text-3xl">Loading...</h1>;
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
                    Price: {ticket.price} MATIC
                  </p>
                </div>
                {ticket.quantity > 1 ? (
                  <div>
                    <div>
                      <label>
                        Qty:
                        <select
                          value={qty}
                          onChange={(e) => setQty(e.target.value)}
                        >
                          {/* need both e and i as e is the value of the array and i is the index (which is what we actually want) */}
                          {[
                            ...Array(
                              Math.min(ticket.limit, ticket.quantity) + 1
                            ),
                          ].map((e, i) => {
                            return (
                              <option key={i} value={i}>
                                {i}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                    </div>
                    <button
                      onClick={() => {
                        qty > 0
                          ? buyTicket(ticket.tokenId, ticket.price)
                          : alert("Please select quantity");
                      }}
                      className="font-bold mt-4 bg-blue-500 text-white rounded p-4 shadow-lg"
                    >
                      Buy Ticket
                    </button>
                  </div>
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
