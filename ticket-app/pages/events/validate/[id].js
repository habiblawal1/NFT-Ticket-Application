import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ethers } from "ethers";
import axios from "axios";

const QrReader = dynamic(() => import("react-qr-reader"), { ssr: false });

import { nftaddress } from "../../../config";
import { signers, marketContract } from "../../../components/contracts";

export default function validate() {
  const router = useRouter();
  const eventId = router.query["id"];
  const [ticket, setTicket] = useState("");
  const [eventName, setEventName] = useState("");
  const [id, setId] = useState("");
  const [sig, setSig] = useState("");
  const [err, setErr] = useState("");
  const [valErr, setValErr] = useState("");
  const [ver, setVer] = useState("");
  const [loadingState, setLoadingState] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    loadEvent();
  }, [router.isReady]);

  // TODO - Add message for if a user who doesn't own the event tries to access the page
  const handleErrorWebCam = (error) => {
    alert(error);
    console.log(error);
    setValErr(error.message);
  };
  const handleScanWebCam = (result) => {
    if (result) {
      setTicket(result);
      console.log("SCANNED");
      setVer("");
      setValErr("");
      scannedTicket();
    }
  };

  const scannedTicket = () => {
    let splitString = ticket.split("-");
    if (splitString.length != 2) {
      setValErr("INVALID CODE");
      console.log("INVALID TICKET = ", ticket);
      return;
    }
    setId(splitString[0]);
    setSig(splitString[1]);
  };

  async function loadEvent() {
    try {
      if (!Number.isInteger(parseInt(eventId))) {
        throw new Error(`Event ID '${eventId}' is not valid`);
      }
      const contracts = await signers();
      const { signer, signedMarketContract } = contracts;
      const address = await signer.getAddress();

      console.log("GET EVENT DATA");
      const data = await signedMarketContract.getEvent(eventId);
      console.log("EVENT DATA");
      console.log(data);
      if (data.owner != address) {
        console.log(data.owner);
        console.log(address);
        throw new Error(`You do not not own the Event ID #${eventId}`);
      }
      const eventUri = await data.uri;
      if (!eventUri) {
        throw new Error("Could not find Event URI");
      }
      console.log("URI = ", eventUri);
      const eventRequest = await axios.get(eventUri);
      const eventData = eventRequest.data;
      setEventName(eventData.name);
      setLoadingState(true);
    } catch (error) {
      console.log(error);
      error.data === undefined
        ? setErr(error.message)
        : setErr(error.data.message);
      setLoadingState(true);
    }
  }

  async function verifyTicket() {
    try {
      const contracts = await signers();
      const { signedMarketContract } = contracts;
      let verifiedAddress = ethers.utils.verifyMessage(id, sig);
      await signedMarketContract.validateTicket(
        nftaddress,
        verifiedAddress,
        id
      );
      //   let qty = await tokenContract.balanceOf(verifiedAddress, id);
      //   console.log(`Balance of ${verifiedAddress} is ${qty.toNumber()}`);
      setVer(
        `SUCCESS! Ticket #${id} successully verified for Account ${verifiedAddress}`
      );
    } catch (error) {
      console.log(error);
      error.data === undefined
        ? setValErr(error.message)
        : setValErr(error.data.message);
    }
  }

  if (!loadingState) {
    return (
      <div className="container">
        <h1 className="display-1">Loading...</h1>
      </div>
    );
  }

  if (err) {
    return (
      <div className="container">
        <p className="text-red display-6">{err}</p>
      </div>
    );
  }

  return (
    <div className="container text-center ">
      <h1 className="m-2">Validate Tickets</h1>
      <h2 className="m-2">
        <span className="text-primary">{eventName}</span> - #{eventId}
      </h2>
      <h3>Scan QR Code</h3>
      <div className="d-flex justify-content-center m-3">
        <div style={{ height: "32vh", width: "32vh" }}>
          <QrReader
            delay={300}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              marginLeft: "auto",
              marginRight: "auto",
            }}
            onError={handleErrorWebCam}
            onScan={handleScanWebCam}
          />
        </div>
      </div>
      <p className="display-6">Scan User's Ticket QR Code</p>
      {ticket && (
        <>
          <h3>Scanned Result:</h3>
          <div>
            {id && <h3 className="text-primary">Ticket ID: {id}</h3>}
            {sig && <h3 className="overflow-auto">Signature: {sig}</h3>}
            {!valErr && (
              <button onClick={verifyTicket} className="btn btn-primary">
                Verfiy
              </button>
            )}
            <h3 className="text-green display-6">{ver}</h3>
          </div>
        </>
      )}

      {valErr && <p className="text-red display-6">{valErr}</p>}

      {(valErr || ver) && (
        <h3>
          Scan another barcode to verify next ticket
          <i className="bi bi-arrow-up"></i>
        </h3>
      )}
    </div>
  );
}
