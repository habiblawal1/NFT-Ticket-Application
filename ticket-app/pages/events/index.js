import { ethers, providers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";

import { nftaddress, nftmarketaddress } from "../../config";

import NFT from "../../artifacts/contracts/NFTTicket.sol/NFTTicket.json";
import Market from "../../artifacts/contracts/TicketMarket.sol/TicketMarket.json";

export default function allEvents() {
  const [events, setEvents] = useState([]);
  const [loadingState, setLoadingState] = useState("not-loaded");

  useEffect(() => {
    loadEvents();
  }, []);
  async function loadEvents() {
    const provider = new ethers.providers.JsonRpcProvider();
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(
      nftmarketaddress,
      Market.abi,
      provider
    );

    console.log("Market Address = ", nftmarketaddress);
    console.log("Ticket Address = ", nftaddress);

    const data = await marketContract.getMyEvents();
    const allEvents = await Promise.all(
      data.map(async (i) => {
        const imgUri = await i.imageUri;
        const meta = await axios.get(imgUri);
        let currEvent = {
          eventId: i.eventId.toString(),
          name: i.name,
          description: i.description,
          imageUri: meta.data.image,
          location: i.location,
          eventStartDate: new Date(
            i.eventStartDate.toNumber() * 1000
          ).toLocaleDateString(),
          owner: i.owner,
        };
        return currEvent;
      })
    );

    setEvents(allEvents);
    setLoadingState("loaded");
  }

  if (loadingState === "loaded" && !events.length) {
    return (
      <h1 className="px-20 py-10 text-3xl">No Events In the Marketplace</h1>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: "1600px" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {events.map((event) => (
            <div
              key={event.eventId.toNumber()}
              className="border shadow rounded-l overflow-hidden"
            >
              <img src={event.imageUri} />
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  {event.name}
                </p>
              </div>
              <div style={{ height: "70px", overflow: "hidden" }}>
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  {event.description}
                </p>
              </div>
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  {new Date(
                    event.eventStartDate.toNumber() * 1000
                  ).toLocaleDateString()}
                </p>
              </div>
              <div style={{ height: "70px", overflow: "hidden" }}>
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  {event.location}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <h1>All Events Page</h1>
      <h1>Market Contract ={}</h1>
      <h1>Ticket Contract =</h1>
    </div>
  );
}
