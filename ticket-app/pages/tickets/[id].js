import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import QR from "../../components/QR";
import axios from "axios";
import styles from "../../styles/Card.module.scss";

import {
  signers,
  tokenContract,
  marketContract,
} from "../../components/Contracts";

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
    setLoadingState(true);
  }, [router.isReady]);

  async function loadData() {
    try {
      if (!Number.isInteger(parseInt(tokenId))) {
        throw new Error(`Ticket ID '${tokenId}' is not valid`);
      }
      const signedContracts = await signers();
      const { signer } = signedContracts;
      const address = await signer.getAddress();
      let myBalance = await tokenContract.balanceOf(address, tokenId);
      myBalance = myBalance.toNumber();
      if (myBalance < 1) {
        throw new Error(`You do not own the Ticket ID #${tokenId}`);
      }
      const ticketUri = await tokenContract.uri(tokenId);
      if (!ticketUri) {
        throw new Error("Could not find Token URI");
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
    } catch (error) {
      console.log(error);
      error.data === undefined
        ? setErr(error.message)
        : setErr(error.data.message);
    }
  }

  if (!loadingState) {
    return <h1 className="container display-1">Loading...</h1>;
  }

  if (err) {
    return (
      <div className="container text-center">
        <p className="text-red display-6">{err}</p>
        <p>
          <Link href={`/tickets/`}>My Tickets-&gt;</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="container justify-content-center align-items-center border-bottom  border-secondary">
      <div className="row justify-content-center align-items-center">
        <div className="col-auto card shadow border border-dark rounded-l overflow-scroll m-3 pt-3">
          <img
            style={{ height: "22vh", overflow: "auto" }}
            src={ticket.imageUri}
            className={styles.cardImgTop}
          />
          <div className="card-body">
            <div id="eventDetails">
              <div
                className="m-3"
                style={{ maxHeight: "70px", overflow: "auto" }}
              >
                <h2 className="card-title text-center">
                  <span className="fw-bold text-primary">
                    {ticket.eventName}
                  </span>{" "}
                  - ID: #{ticket.eventId}
                </h2>
              </div>
              <div style={{ height: "40px", overflow: "auto" }}>
                <h5>
                  <i className="bi bi-calendar3"></i> {ticket.startDate}
                </h5>
              </div>
              <div style={{ height: "65px", overflow: "auto" }}>
                <h5>
                  <i className="bi bi-geo-alt-fill"></i> {ticket.location}
                </h5>
              </div>
            </div>
            <div id="ticketDetails" className="border-top border-dark">
              <h3 className="my-3 text-center">Ticket Details</h3>

              <div className="row">
                <div className="col">
                  <div style={{ maxHeight: "70px", overflow: "auto" }}>
                    <h2>
                      <i className="bi bi-ticket-fill"></i> {ticket.ticketName}
                    </h2>
                  </div>

                  <div style={{ height: "35px", overflow: "auto" }}>
                    <h5 className="">ID: #{ticket.tokenId}</h5>
                  </div>
                  <h4>Description:</h4>
                  <div style={{ maxHeight: "90px", overflow: "auto" }}>
                    <h6>{ticket.ticketDescription}</h6>
                  </div>
                </div>
                <div className="col-auto text-center">
                  <h3>Qty: {ticket.quantity}</h3>
                  <h4 className="text-primary fw-bold">
                    Price: £{ticket.gbpPrice}
                  </h4>
                  <p className="text-secondary">= {ticket.price} MATIC</p>
                </div>
              </div>
              <div>
                <div className="d-flex justify-content-center m-3">
                  <QR
                    tokenId={tokenId}
                    event={`${ticket.eventName} - ID: #${ticket.eventId}`}
                    ticket={`${ticket.ticketName} - ID: #${tokenId}`}
                  />
                </div>
                <p className="fw-bold text-center">
                  <Link href={`/resale/create/${tokenId}`}>
                    <a className="text-black">
                      Resell Ticket{" "}
                      <i className="bi bi-arrow-right-circle-fill"></i>
                    </a>
                  </Link>
                </p>
              </div>
            </div>
            {ticket.eventDescription && (
              <div id="eventDescription" className="border-top border-dark">
                <h3 className="my-3 ">Event Description</h3>
                <h6>{ticket.eventDescription}</h6>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
