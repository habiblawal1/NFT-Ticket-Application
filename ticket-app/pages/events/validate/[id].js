import { useRouter } from "next/router";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ethers } from "ethers";
import Web3Modal from "web3modal";

const QrReader = dynamic(() => import("react-qr-reader"), { ssr: false });

import { nftaddress, nftmarketaddress } from "../../../config";

import Market from "../../../artifacts/contracts/TicketMarket.sol/TicketMarket.json";

export default function validate() {
  const router = useRouter();
  const eventId = router.query["id"];
  const [ticket, setTicket] = useState("");
  const [id, setId] = useState("");
  const [sig, setSig] = useState("");
  const [err, setErr] = useState("");
  const [ver, setVer] = useState("");

  useEffect(() => {
    if (!ticket) return;
    scannedTicket();
  }, [ticket]);

  // TODO - Add message for if a user who doesn't own the event tries to access the page
  const handleErrorWebCam = (error) => {
    alert(error);
    console.log(error);
  };
  const handleScanWebCam = (result) => {
    if (result) {
      setVer("");
      setErr("");
      setTicket(result);
    }
  };

  const scannedTicket = () => {
    let splitString = ticket.split("-");
    if (splitString.length != 2) {
      setErr("INVALID CODE");
    }
    setId(splitString[0]);
    setSig(splitString[1]);
  };

  async function verifyTicket() {
    try {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      //We need to povide a signer instead of JSONRPC so we know who the signer is
      const marketContract = new ethers.Contract(
        nftmarketaddress,
        Market.abi,
        signer
      );

      let verifiedAddress = ethers.utils.verifyMessage(id, sig);
      await marketContract.validateTicket(nftaddress, verifiedAddress, id);
      //   let qty = await tokenContract.balanceOf(verifiedAddress, id);
      //   console.log(`Balance of ${verifiedAddress} is ${qty.toNumber()}`);
      setVer(
        `SUCCESS! Ticket #${id} successully verified for Account ${verifiedAddress}`
      );
    } catch (error) {
      console.error(error);
      if (error.data) {
        setErr(error.data.message);
      } else {
        setErr("Unable to verify ticket");
      }
    }
  }
  return (
    <div>
      <h1>Validate Event {eventId}</h1>
      <h3>Scan QR Code</h3>
      <div>
        <QrReader
          delay={300}
          style={{
            width: "25%",
            height: "25%",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
          }}
          onError={handleErrorWebCam}
          onScan={handleScanWebCam}
        />
      </div>
      <h3>Scanned Result:</h3>
      {ticket && (
        <div>
          <h3>Ticket ID = {id}</h3>
          <h3>Signature = {sig}</h3>
          <button
            onClick={verifyTicket}
            className="font-bold mt-4 bg-blue-500 text-white rounded p-4 shadow-lg"
          >
            Verfiy
          </button>
          <h3 className="text-green-500 font-semibold">{ver}</h3>
        </div>
      )}

      {err && (
        <p style={{ height: "64px" }} className="text-red-500 font-semibold">
          {err}
        </p>
      )}
    </div>
  );
}
