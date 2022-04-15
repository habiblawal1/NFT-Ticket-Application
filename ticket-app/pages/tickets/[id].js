import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import QR from "../../components/QR";
import axios from "axios";

import {
  signers,
  tokenContract,
  marketContract,
} from "../../components/contracts";

import PoundPrice from "../../components/price/Pound";

export default function ticketDetails() {
  const router = useRouter();
  const tokenId = router.query["id"];
  const [loadingState, setLoadingState] = useState(false);
  const [ticket, setTicket] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!router.isReady) return;
    loadData();
  }, [router.isReady]);

  async function loadData() {
    const contracts = await signers();
    const { signedMarketContract, signer } = contracts;
    const address = await signer.getAddress();
    let myBalance = await tokenContract.balanceOf(address, tokenId);
    myBalance = myBalance.toNumber();
    console.log("My balance = ", myBalance);
    if (myBalance < 1) {
      setLoadingState(true);
      setErr(`You do not own the Ticket Id #${tokenId}`);
      return;
    }
    try {
      const ticketUri = await tokenContract.uri(tokenId);
      if (!ticketUri) {
        setErr("Could not find Token URI");
        return;
      }
      const ticketRequest = await axios.get(ticketUri);
      const ticketData = ticketRequest.data;
      const eventId = ticketData.properties.eventId;
      console.log("Event Id: ", eventId);
      console.log(ticketData);

      const eventContractData = await marketContract.getEvent(eventId);
      const eventUri = await eventContractData.uri;
      const eventRequest = await axios.get(eventUri);
      const eventData = eventRequest.data;
      // console.log("Event Data: ", eventData);
      // console.log("Ticket Data: ", ticketData);

      let price = ticketData.properties.price;
      let gbpPrice = await PoundPrice(price);

      let _ticket = {
        eventId,
        eventName: eventData.name,
        eventDescription: eventData.description,
        imageUri: eventData.image,
        startDate: eventData.eventDate,
        location: eventData.location,
        tokenId,
        ticketName: ticketData.name,
        ticketDescription: ticketData.description,
        price,
        gbpPrice,
        quantity: myBalance,
      };

      console.log(_ticket);
      setTicket(_ticket);
      setLoadingState(true);
    } catch (error) {
      setErr(error);
      console.log(error);
    }
  }

  if (!loadingState) {
    return <h1 className="px-20 py-10 text-3xl">Loading...</h1>;
  }

  if (!!err) {
    return (
      <div className="flex justify-center">
        <p style={{ height: "64px" }} className="text-red font-semibold">
          {err}
        </p>
        <p style={{ height: "64px" }} className="text-primary font-semibold">
          <Link href={`/tickets/`}>My Tickets-&gt;</Link>
        </p>
      </div>
    );
  }

  // TODO - Add message for if a user who doesn't own the token tries to access the page
  return (
    <>
      <div className="flex justify-center">
        <div className="px-4" style={{ maxWidth: "1600px" }}>
          <div key={ticket.eventId} className="border-b overflow-hidden">
            <img src={ticket.imageUri} />
            <div className="p-1">
              <p style={{ height: "64px" }} className="text-3xl">
                <span className="font-semibold text-primary">
                  {ticket.eventName}
                </span>{" "}
                ID: #{ticket.eventId}
              </p>
            </div>
            <div className="p-1">
              <p style={{ height: "64px" }} className="text-3xl font-semibold">
                Date: {ticket.startDate}
              </p>
            </div>
            <div className="p-1">
              <p style={{ height: "64px" }} className="text-3xl font-semibold">
                Location: {ticket.location}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center mt-10">
        <div className="px-4" style={{ maxWidth: "1600px" }}>
          <div key={ticket.ticket} className="border-b overflow-hidden">
            <h1 className="font-bold text-4xl">Ticket Details</h1>
            <div className="p-1">
              <p className="text-3xl font-semibold">{ticket.ticketName}</p>
            </div>
            <div className="p-1">
              <p className="text-3xl font-semibold">ID: #{ticket.eventId}</p>
            </div>
            {ticket.ticketDescription && (
              <div className="p-1">
                <p className="text-3xl">Description:</p>
                <p style={{ height: "30px" }}>{ticket.ticketDescription}</p>
              </div>
            )}

            <div className="p-1">
              <p
                style={{ height: "40px" }}
                className="text-2xl  text-primary font-semibold"
              >
                Qty: {ticket.quantity}
              </p>
            </div>
            <div className="p-1">
              <p className="text-2xl  text-primary font-semibold">
                £{ticket.gbpPrice}
              </p>
              <p
                style={{ height: "64px" }}
                className="text-1xl  text-dark_grey font-semibold"
              >
                = {ticket.price} MATIC
              </p>
            </div>
            <div>
              <div className="flex justify-center ">
                {/* TODO, put actual event */}
                <QR
                  tokenId={tokenId}
                  event={"#2 - Chelsea Vs Arsenal"}
                  ticket={`#${tokenId} - Student Ticket`}
                />
              </div>
              <div className="flex justify-center m-2 underline">
                <p className="font-semibold">
                  <Link href={`/resale/create/${tokenId}`}>
                    <a className="mr-6">Resell Ticket -&gt;</a>
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center mt-10">
        <div className="px-4" style={{ maxWidth: "1600px" }}>
          <div
            key={ticket.ticket}
            className=" shadow rounded-l overflow-hidden"
          >
            <h1 className="font-semibold text-2xl">Event Description</h1>
            {ticket.eventDescription && (
              <div className="p-1">
                <p style={{ height: "30px" }}>{ticket.eventDescription}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
