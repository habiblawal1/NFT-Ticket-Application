import { useRouter } from "next/router";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import Web3Modal from "web3modal";
import axios from "axios";

import PoundPrice from "../../components/price/Pound";

import { nftaddress, nftmarketaddress } from "../../config";

import NFT from "../../artifacts/contracts/NFTTicket.sol/NFTTicket.json";
import Market from "../../artifacts/contracts/TicketMarket.sol/TicketMarket.json";

export default function eventResaleListings() {
  const [event, setEvent] = useState();
  const [ticket, setTicket] = useState();
  const [resaleTickets, setResaleTickets] = useState([]);
  const [loadingState, setLoadingState] = useState(false);
  const router = useRouter();
  const tokenId = router.query["id"];
  useEffect(() => {
    if (!router.isReady) return;
    loadData();
  }, [router.isReady]);

  async function loadData() {
    await loadEvent();
    await loadResaleTickets();
  }

  async function loadEvent() {
    const provider = new ethers.providers.JsonRpcProvider();
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(
      nftmarketaddress,
      Market.abi,
      provider
    );

    const ticketUri = await tokenContract.uri(tokenId);
    console.log("Ticket URI: ", ticketUri);
    const ticketRequest = await axios.get(ticketUri);
    const ticketData = ticketRequest.data;

    let eventId = ticketData.properties.eventId;
    const thisEvent = await marketContract.getEvent(eventId);
    console.log("SOOOOOO ");

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
  }

  async function loadResaleTickets() {
    const provider = new ethers.providers.JsonRpcProvider();
    const marketContract = new ethers.Contract(
      nftmarketaddress,
      Market.abi,
      provider
    );

    // uint indexed resaleId,
    // uint indexed tokenId,
    // address seller,
    // uint256 resalePrice,
    // bool sold
    const data = await marketContract.getResaleTickets(tokenId);
    console.log("SOLIDITY Resale Ticket Data: ", data);
    const tickets = await Promise.all(
      data.map(async (i) => {
        let price = ethers.utils.formatUnits(i.resalePrice.toString(), "ether");
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
    setLoadingState(true);
  }

  async function buyTicket(resaleId, price) {
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
    /* user will be prompted to pay the asking price to complete the transaction */
    console.log("PRICE, ", price);
    const ticketPrice = ethers.utils.parseUnits(price, "ether");
    const transaction = await marketContract.buyResaleTicket(
      nftaddress,
      resaleId,
      {
        value: ticketPrice,
      }
    );
    await transaction.wait();
    //TODO - You don't redericted
    router.push("/tickets");
  }

  if (!loadingState) {
    return <h1 className="container display-1">Loading...</h1>;
  }

  if (loadingState && !resaleTickets.length) {
    return (
      <h1 className="container display-6">
        No resale tickets available for the ticket "{ticket.name} - #
        {ticket.tokenId}"
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
