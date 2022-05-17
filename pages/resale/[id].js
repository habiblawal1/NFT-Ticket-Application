import { useRouter } from "next/router";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import styles from "../../styles/Card.module.scss";

import PoundPrice from "../../components/price/Pound";
import { nftaddress } from "../../config";
import {
  marketContract,
  tokenContract,
  signers,
} from "../../components/Contracts";

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
      setErr(`Ticket ID '${tokenId}' is not valid`);
    } else {
      await loadEvent();
      await loadResaleTickets();
    }
    setLoadingState(true);
  }

  async function loadEvent() {
    try {
      const ticketUri = await tokenContract.uri(tokenId);
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
          console.log("SELLER = ", i.seller);
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

  if (!resaleTickets.length) {
    return err ? (
      <p className="container text-danger display-6">{err}</p>
    ) : (
      <h1 className="container text-center display-6">
        No resale tickets available for the Ticket ID: {tokenId}
      </h1>
    );
  }

  return (
    <div className="container justify-content-center align-items-center">
      <h1 className="text-center m-4">Resale Listings</h1>
      <div className="row justify-content-center align-items-center">
        <div className="card col-auto bg-cream p-3 shadow">
          <h3 className="card-title display-6 text-center">
            <span className="text-primary fw-bold">{event.name}</span> - ID: #
            {event.eventId}
          </h3>
          <img
            style={{ height: "22vh", overflow: "auto" }}
            src={event.imageUri}
            className={styles.cardImgTop}
          />
        </div>
      </div>
      <div className="text-center mt-10">
        <h2>
          <i className="bi bi-ticket-fill"></i>{" "}
          <span className="fw-bold">{ticket.name}</span> - ID: #{ticket.tokenId}
        </h2>
        <h6>{ticket.description}</h6>
      </div>
      {resaleTickets.map((_ticket) => (
        <div
          key={_ticket.resaleId}
          className="row justify-content-center align-items-center"
        >
          <div className="col-auto card shadow border border-dark rounded-l overflow-scroll m-3 pt-3">
            <div className="card-body">
              <div className="row">
                <div className="col-7">
                  <h4>Seller Address:</h4>
                  <p>{_ticket.seller}</p>
                </div>
                <div className="col-5 text-center">
                  <h4 className="text-primary fw-bold">
                    Resale Price: £{_ticket.gbpPrice}
                  </h4>
                  <p className="text-secondary">= {_ticket.price} MATIC</p>
                  <button
                    onClick={() => {
                      buyTicket(_ticket.resaleId, _ticket.price);
                    }}
                    className="btn btn-primary"
                  >
                    Buy Ticket
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      {err && <p className="text-danger text-center display-6">{err}</p>}
    </div>
  );
}
