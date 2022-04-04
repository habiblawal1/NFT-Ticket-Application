import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ethers, providers } from "ethers";
import QR from "../../src/compontents/QR";
import Web3Modal from "web3modal";

import { nftaddress, nftmarketaddress } from "../../config";

import NFT from "../../artifacts/contracts/NFTTicket.sol/NFTTicket.json";
import Market from "../../artifacts/contracts/TicketMarket.sol/TicketMarket.json";

export default function ticketDetails() {
  const router = useRouter();
  const ticketId = router.query["id"];
  const [addr, setAddress] = useState([]);
  useEffect(() => {
    if (!router.isReady) return;
    getSigner();
  }, [router.isReady]);
  async function getSigner() {
    console.log(ticketId);
  }

  // TODO - Add message for if a user who doesn't own the token tries to access the page
  return (
    <div>
      <h1>Ticket ID: {ticketId}</h1>
      <div>
        <QR
          tokenId={ticketId}
          event={"#2 - Chelsea Vs Arsenal"}
          ticket={`#${ticketId} - Student Ticket`}
        />
      </div>
    </div>
  );
}
