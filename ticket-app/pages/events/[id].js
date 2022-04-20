import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import styles from "../../styles/Card.module.scss";

import PoundPrice from "../../components/price/Pound";

import { nftaddress, nftmarketaddress } from "../../config";

import {
  signers,
  tokenContract,
  marketContract,
} from "../../components/contracts";

export default function eventDetails() {
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loadingState, setLoadingState] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();
  const eventId = router.query["id"];
  useEffect(() => {
    if (!router.isReady) return;
    loadData();
  }, [router.isReady]);

  async function loadData() {
    await loadEvent();
    !err && (await loadTickets());
    setLoadingState(true);
  }

  async function loadEvent() {
    try {
      if (!Number.isInteger(parseInt(eventId))) {
        throw new Error(`Event ID '${eventId}' is not valid`);
      }
      const data = await marketContract.getEvent(eventId);
      const eventUri = await data.uri;
      if (!eventUri) {
        throw new Error(`Could not find URI for the Event ID #${eventId}`);
      }
      console.log("URI = ", eventUri);
      const eventRequest = await axios.get(eventUri);
      const eventData = eventRequest.data;

      //console.log("EVENT DATA = ", eventData);
      const currEvent = {
        eventId: data.eventId.toNumber(),
        name: eventData.name,
        description: eventData.description,
        imageUri: eventData.image,
        location: eventData.location,
        startDate: eventData.eventDate,
        owner: data.owner,
      };
      console.log("Event: ", currEvent);
      setEvent(currEvent);
    } catch (error) {
      console.log(error);
      error.data === undefined
        ? setErr(error.message)
        : setErr(error.data.message);
    }
  }

  async function loadTickets() {
    try {
      const contract = await signers();
      const { signer } = contract;
      const address = await signer.getAddress();
      const data = await marketContract.getEventTickets(eventId);
      const eventTickets = await Promise.all(
        data.map(async (i) => {
          const tokenId = i.tokenId.toNumber();
          const tokenUri = await tokenContract.uri(tokenId);
          const ticketRequest = await axios.get(tokenUri);
          const ticketData = ticketRequest.data;

          const resaleTickets = await marketContract.getResaleTickets(tokenId);
          let resaleAvail;
          resaleTickets.length > 0
            ? (resaleAvail = true)
            : (resaleAvail = false);
          let price = ethers.utils.formatUnits(i.price.toString(), "ether");
          let gbpPrice = await PoundPrice(price);
          console.log("In Pounds", gbpPrice);
          let qty = await tokenContract.balanceOf(nftmarketaddress, tokenId);
          let myQty = await tokenContract.balanceOf(address, tokenId);
          let _ticket = {
            tokenId,
            name: ticketData.name,
            description: ticketData.description,
            price,
            gbpPrice,
            limit: i.purchaseLimit.toNumber(),
            quantity: qty.toNumber(),
            resaleAvail,
            buyQty: 0,
            myQty,
          };
          return _ticket;
        })
      );
      setTickets(eventTickets);
    } catch (error) {
      console.log(error);
      error.data === undefined
        ? setErr(error.message)
        : setErr(error.data.message);
    }
  }

  async function buyTicket(id, price, qty) {
    try {
      setLoadingState(false);
      const signedContracts = await signers();
      const { signedMarketContract } = signedContracts;
      /* needs the user to sign the transaction, so will use Web3Provider and sign it */
      /* user will be prompted to pay the asking proces to complete the transaction */
      const ticketPrice = ethers.utils.parseUnits(price, "ether");
      const transaction = await signedMarketContract.buyTicket(
        nftaddress,
        id,
        qty,
        {
          value: ticketPrice.mul(qty),
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
      setLoadingState(true);
    }
  }

  if (!loadingState) {
    return <h1 className="container display-1">Loading...</h1>;
  }

  if (err) {
    <div className="container text-center">
      <p className="text-red display-6">{err}</p>
    </div>;
  }

  return (
    event && (
      <>
        <section>
          <div className="container justify-content-center align-items-center border-bottom  border-secondary">
            <div className="row justify-content-center align-items-center">
              <div className="col-8 col-lg-4 col-md-6  text-center card shadow border border-dark rounded-l overflow-scroll m-3 pt-3">
                <img src={event.imageUri} className={styles.cardImgTop} />
                <div className="card-body">
                  <div style={{ height: "60px", overflow: "auto" }}>
                    <h3 className="card-title text-center">
                      <span className="fw-bold text-primary">{event.name}</span>{" "}
                      - ID: {event.eventId}
                    </h3>
                  </div>
                  <div style={{ height: "55px", overflow: "auto" }}>
                    <p className="">{event.description}</p>
                  </div>
                  <div style={{ height: "40px", overflow: "auto" }}>
                    <p className="">
                      <i className="bi bi-calendar3"></i> {event.startDate}
                    </p>
                  </div>
                  <div style={{ height: "65px", overflow: "auto" }}>
                    <p className="">
                      <i className="bi bi-geo-alt-fill"></i> {event.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section>
          <div className="container justify-content-center align-items-center">
            <h1 className="text-center m-3">Tickets</h1>
            <div className="row justify-content-center align-items-center">
              {tickets.length > 0 &&
                tickets.map((ticket) => (
                  <div
                    key={ticket.tokenId}
                    style={{ height: "160px", overflow: "auto" }}
                    className="col-12 border-bottom border-dark d-flex justify-content-between m-3"
                  >
                    <div className="w-50 text-center">
                      <h3>
                        <span className="fw-bold">{ticket.name}</span>
                        {` - ID :${ticket.tokenId} `}
                      </h3>
                      <div style={{ height: "55px", overflow: "auto" }}>
                        {ticket.description && <h6>{ticket.description}</h6>}
                      </div>
                    </div>
                    <div className="w-50 justify-content-center align-items-center text-center m-3">
                      <div className="d-flex justify-content-between">
                        <div className="w-50">
                          <h4 className="text-primary fw-bold">
                            Price: £{ticket.gbpPrice}
                          </h4>
                          <p className="text-secondary">
                            = {ticket.price} MATIC
                          </p>
                        </div>
                        <div className="text-center w-50 m-2">
                          {ticket.quantity > 1 ? (
                            <>
                              <div className="input-group mb-3">
                                <span className="input-group-text" id="qty">
                                  Qty (Max ={" "}
                                  {Math.min(
                                    ticket.quantity,
                                    ticket.limit - ticket.myQty
                                  )}
                                  )
                                </span>
                                <input
                                  className="form-control"
                                  type="text"
                                  aria-label="qty"
                                  onChange={(e) =>
                                    (ticket.buyQty = e.target.value)
                                  }
                                />
                              </div>
                              <button
                                onClick={() => {
                                  ticket.buyQty > 0
                                    ? buyTicket(
                                        ticket.tokenId,
                                        ticket.price,
                                        ticket.buyQty
                                      )
                                    : alert("Please select quantity");
                                }}
                                className="btn btn-primary"
                              >
                                Buy Tickets
                              </button>
                            </>
                          ) : (
                            <h5 className="text-secondary">SOLD OUT</h5>
                          )}
                        </div>
                      </div>
                      {ticket.resaleAvail && (
                        <Link href={`/resale/${ticket.tokenId}`}>
                          <a className="text-dark fw-bold text-center">
                            Available on resale{" "}
                            <i className="bi bi-arrow-right"></i>
                          </a>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              {tickets.length < 1 && (
                <h1 className="display-5 text-center text-secondary">
                  No tickets available for this event
                </h1>
              )}
            </div>
          </div>
        </section>

        {err && <p className="text-red display-6">{err}</p>}
      </>
    )
  );
}
