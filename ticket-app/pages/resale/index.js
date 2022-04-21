import Link from "next/link";
import { ethers } from "ethers";
import { useState, useEffect } from "react";
import Web3Modal from "web3modal";
import axios from "axios";
import styles from "../../styles/Card.module.scss";

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
  //TODO - Check how the UI looks for when I list multiple tickets on resale
  if (!loadingState) {
    return <h1>Loading...</h1>;
  }
  return (
    <div className="container justify-content-center align-items-center">
      <h1 className="text-center m-4">Your Resale Listings</h1>
      {resaleTickets.length < 1 ? (
        <p className="display-5 text-center">
          You do not own any tickets right now
        </p>
      ) : (
        <div className="row justify-content-center align-items-center">
          {resaleTickets.map((ticket) => (
            <div key={ticket.tokenId} className="card shadow">
              <div className="row card-body">
                <div className="col-3 d-none d-md-block">
                  <img src={ticket.imageUri} className={styles.cardImgTop} />
                </div>
                <div className="col-7 col-md-6">
                  <div style={{ height: "65px", overflow: "auto" }}>
                    <h3 className="card-title">
                      <span className="fw-bold text-primary">
                        {ticket.eventName}
                      </span>{" "}
                      - ID: {ticket.eventId}
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
                <div className="col-5 col-md-3">
                  <div style={{ height: "60px", overflow: "auto" }}>
                    <h4>
                      <i className="bi bi-ticket-fill"></i> {ticket.ticketName}
                    </h4>
                  </div>
                  <div style={{ height: "32px", overflow: "auto" }}>
                    <h5>ID: #{ticket.tokenId}</h5>
                  </div>
                  <div style={{ height: "100px", overflow: "auto" }}>
                    <h5 className="text-primary fw-bold">
                      Resale Price: £{ticket.gbpPrice}
                    </h5>
                    <p className="text-secondary">= {ticket.price} MATIC</p>
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
