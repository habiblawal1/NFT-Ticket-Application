import Link from "next/link";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import styles from "../../styles/Card.module.scss";
import axios from "axios";

import PoundPrice from "../../components/price/Pound";

import { tokenContract, signers } from "../../components/Contracts";
import { nftaddress } from "../../config";

export default function myTickets() {
  const [tickets, setTickets] = useState([]);
  const [loadingState, setLoadingState] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    try {
      const signedContracts = await signers();
      const { signedMarketContract, signer } = signedContracts;
      const userAddress = await signer.getAddress();

      const ticketContractData = await signedMarketContract.getMyTickets(
        nftaddress
      );
      console.log(ticketContractData);
      const myTickets = await Promise.all(
        ticketContractData.map(async (i) => {
          const tokenId = i.tokenId.toNumber();
          console.log(i.eventId.toNumber());
          const tokenUri = await tokenContract.uri(tokenId);
          const ticketRequest = await axios.get(tokenUri);
          const ticketData = ticketRequest.data;
          console.log("Ticket Data: ", ticketData);

          const eventId = i.eventId.toNumber();
          const eventContractData = await signedMarketContract.getEvent(
            eventId
          );
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
    <p className="container text-danger display-6">{err}</p>;
  }
  return (
    <div className="container justify-content-center align-items-center">
      <h1 className="text-center m-4">Your Tickets</h1>
      {tickets.length < 1 ? (
        <p className="display-5 text-center">
          You do not own any tickets right now
        </p>
      ) : (
        <div className="row justify-content-center align-items-center">
          {tickets.map((ticket) => (
            <div
              key={ticket.tokenId}
              className="card border border-dark shadow"
            >
              <div className="row card-body">
                <div className="col-3 d-none d-md-block">
                  <img src={ticket.imageUri} className={styles.cardImgTop} />
                </div>
                <div className="col-6 col-md-5">
                  <div style={{ height: "65px", overflow: "auto" }}>
                    <h3 className="card-title">
                      <span className="fw-bold text-primary">
                        {ticket.eventName}
                      </span>{" "}
                      - ID: #{ticket.eventId}
                    </h3>
                  </div>
                  <div
                    className="mt-2"
                    style={{ height: "50px", overflow: "auto" }}
                  >
                    <h5>
                      <i className="bi bi-calendar3"></i> {ticket.startDate}
                    </h5>
                  </div>
                  <div style={{ height: "60", overflow: "auto" }}>
                    <h5>
                      <i className="bi bi-geo-alt-fill"></i> {ticket.location}
                    </h5>
                  </div>
                </div>
                <div className="col-4 col-md-3">
                  <div style={{ height: "37px", overflow: "auto" }}>
                    <h3>Qty: {ticket.quantity}</h3>
                  </div>
                  <div style={{ height: "60px", overflow: "auto" }}>
                    <h4>
                      <i className="bi bi-ticket-fill"></i> {ticket.ticketName}
                    </h4>
                  </div>
                  <div style={{ height: "32px", overflow: "auto" }}>
                    <h5>ID: #{ticket.tokenId}</h5>
                  </div>
                  <div style={{ height: "73px", overflow: "auto" }}>
                    <h5 className="text-primary fw-bold">
                      Price: £{ticket.gbpPrice}
                    </h5>
                    <p className="text-secondary">= {ticket.price} MATIC</p>
                  </div>
                </div>
                <div className="col-2 col-md-1 d-flex align-items-center mx-auto">
                  <div
                    data-bs-toggle="tooltip"
                    title="View Ticket Details"
                    className="mx-auto"
                  >
                    <Link href={`/tickets/${ticket.tokenId}`}>
                      <a>
                        <i
                          style={{ fontSize: "45px" }}
                          className="bi bi-arrow-right-square"
                        ></i>
                      </a>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
