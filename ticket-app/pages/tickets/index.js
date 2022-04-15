import Link from "next/link";
import { ethers, providers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";

import PoundPrice from "../../components/price/Pound";

import { nftaddress, nftmarketaddress } from "../../config";

import NFT from "../../artifacts/contracts/NFTTicket.sol/NFTTicket.json";
import Market from "../../artifacts/contracts/TicketMarket.sol/TicketMarket.json";

export default function myTickets() {
  const [tickets, setTickets] = useState([]);
  const [loadingState, setLoadingState] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();

    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
    //We need to povide a signer instead of JSONRPC so we know who the signer is
    const marketContract = new ethers.Contract(
      nftmarketaddress,
      Market.abi,
      signer
    );

    const ticketContractData = await marketContract.getMyTickets(nftaddress);
    const myTickets = await Promise.all(
      ticketContractData.map(async (i) => {
        const tokenId = i.tokenId.toNumber();
        const tokenUri = await tokenContract.uri(tokenId);
        const ticketRequest = await axios.get(tokenUri);
        const ticketData = ticketRequest.data;
        console.log("Ticket Data: ", ticketData);

        const eventId = i.eventId.toNumber();
        const eventContractData = await marketContract.getEvent(eventId);
        const eventUri = await eventContractData.uri;
        const eventRequest = await axios.get(eventUri);
        const eventData = eventRequest.data;
        // console.log("Event Data: ", eventData);
        // console.log("Ticket Data: ", ticketData);

        let price = ethers.utils.formatUnits(i.price.toString(), "ether");
        let gbpPrice = await PoundPrice(price);
        let qty = await tokenContract.balanceOf(userAddress, tokenId);

        let _ticket = {
          eventId,
          eventName: eventData.name,
          imageUri: eventData.image,
          startDate: eventData.eventDate,
          location: eventData.location,
          tokenId,
          ticketName: ticketData.name,
          price,
          gbpPrice,
          quantity: qty.toNumber(),
        };
        return _ticket;
      })
    );
    console.log("Tickets: ", myTickets);
    setTickets(myTickets);
    setLoadingState(true);
  }
  if (!loadingState) {
    return <h1 className="px-20 py-10 text-3xl">Loading...</h1>;
  }
  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: "1600px" }}>
        <h1>Upcoming Tickets</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.tokenId}
              className="border shadow rounded-l overflow-hidden"
            >
              <img src={ticket.imageUri} />
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  Id: {ticket.eventId}
                </p>
              </div>
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  Event: #{ticket.eventId} {ticket.eventName}
                </p>
              </div>
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  Date: {ticket.startDate}
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
                  Ticket: #{ticket.tokenId} {ticket.ticketName}
                </p>
              </div>
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  Qty: {ticket.quantity}
                </p>
              </div>
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  Original Price: £{ticket.gbpPrice}
                </p>
                <div style={{ height: "70px", overflow: "hidden" }}>
                  <p className="text-3xl">= {ticket.price} MATIC</p>
                </div>
              </div>
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-primary font-semibold"
                >
                  {/**TODO - Link takes you to creat ticket page which should already have the eventId filled out */}
                  <Link href={`/tickets/${ticket.tokenId}`}>
                    <a className="mr-6">View Ticket Details</a>
                  </Link>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
