import Link from "next/link";
import { ethers } from "ethers";
import { useState, useEffect } from "react";
import Web3Modal from "web3modal";
import axios from "axios";

import PoundPrice from "../../components/price/Pound";

import { nftaddress, nftmarketaddress } from "../../config";

import NFT from "../../artifacts/contracts/NFTTicket.sol/NFTTicket.json";
import Market from "../../artifacts/contracts/TicketMarket.sol/TicketMarket.json";

export default function myResaleListings() {
  const [err, setErr] = useState("");
  const [resaleTickets, setResaleTickets] = useState([]);
  const [loadingState, setLoadingState] = useState(false);

  useEffect(() => {
    loadListings();
  }, []);

  async function loadListings() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
    //We need to povide a signer instead of JSONRPC so we know who the signer is
    const marketContract = new ethers.Contract(
      nftmarketaddress,
      Market.abi,
      signer
    );

    try {
      const data = await marketContract.getMyResaleListings();
      console.log(data);

      const allListings = await Promise.all(
        data.map(async (i) => {
          let tokenId = i.tokenId.toNumber();
          const ticketUri = await tokenContract.uri(tokenId);
          console.log("Ticket URI: ", ticketUri);
          const ticketRequest = await axios.get(ticketUri);
          const ticketData = ticketRequest.data;

          let eventId = ticketData.properties.eventId;
          const currEvent = await marketContract.getEvent(eventId);
          const eventUri = currEvent.uri;
          console.log("Event URI: ", eventUri);
          const eventRequest = await axios.get(eventUri);
          const eventData = eventRequest.data;
          console.log(i.resalePrice.toString());
          let price = ethers.utils.formatUnits(
            i.resalePrice.toString(),
            "ether"
          );
          let gbpPrice = await PoundPrice(price);
          let currListing = {
            resaleId: i.resaleId.toNumber(),
            eventId,
            eventName: eventData.name,
            imageUri: eventData.image,
            location: eventData.location,
            startDate: eventData.eventDate,
            ticketName: ticketData.name,
            tokenId,
            price,
            gbpPrice,
          };
          return currListing;
        })
      );
      console.log("Your Listings: ", allListings);
      setResaleTickets(allListings);
      setLoadingState(true);
    } catch (error) {
      console.error(error);
      if (error.data) {
        setErr(error.data.message);
      } else {
        setErr(error.message);
      }
    }
  }

  if (!loadingState) {
    return <h1>Loading...</h1>;
  }
  return (
    <div className="container text-center">
      <div className="px-4" style={{ maxWidth: "1600px" }}>
        <h1>My Resale Listings</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {resaleTickets.length > 0 ? (
            resaleTickets.map((ticket) => (
              <div
                key={ticket.resaleId}
                className="border shadow rounded-l overflow-hidden"
              >
                <img src={ticket.imageUri} />
                <div className="p-4">
                  <p
                    style={{ height: "64px" }}
                    className="text-3xl font-semibold"
                  >
                    Event: #{ticket.eventId} - {ticket.eventName}
                  </p>
                </div>
                <div className="p-4">
                  <p
                    style={{ height: "64px" }}
                    className="text-3xl font-semibold"
                  >
                    Event Date: {ticket.startDate}
                  </p>
                </div>
                <div className="p-4">
                  <p
                    style={{ height: "64px" }}
                    className="text-3xl font-semibold"
                  >
                    Location: {ticket.location}
                  </p>
                </div>
                <div style={{ height: "70px", overflow: "hidden" }}>
                  <p
                    style={{ height: "64px" }}
                    className="text-3xl font-semibold"
                  >
                    Location: {ticket.location}
                  </p>
                </div>
                <div className="p-4">
                  <p
                    style={{ height: "64px" }}
                    className="text-3xl font-semibold"
                  >
                    Ticket: #{ticket.tokenId} - {ticket.ticketName}
                  </p>
                </div>
                <div className="p-4">
                  <p
                    style={{ height: "64px" }}
                    className="text-3xl font-semibold"
                  >
                    Resale Price: £{ticket.gbpPrice}
                  </p>
                  <div style={{ height: "70px", overflow: "hidden" }}>
                    <p className="text-3xl">= {ticket.price} MATIC</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div>
              <h1 className="display-4">
                You have no tickets listed for resale
              </h1>
              <p>Go to the My Tickets page to list your ticket for resale</p>
              <p
                style={{ height: "64px" }}
                className="text-primary font-semibold"
              >
                <Link href={`/tickets/`}>
                  <a className="fw-bold">My Tickets -&gt;</a>
                </Link>
              </p>
            </div>
          )}
        </div>
        {err && (
          <p style={{ height: "64px" }} className="text-red font-semibold">
            {err}
          </p>
        )}
      </div>
    </div>
  );
}
