import React from "react";
import Qrcode from "qrcode.react";
import jsPDF from "jspdf";
import { useState } from "react";
import { ethers } from "ethers";

import { signers } from "./Contracts";

const QR = (props) => {
  const [show, setShow] = useState(false);
  const [qr, setQr] = useState("");
  const [err, setErr] = useState("");

  const createSplitSignature = async (message) => {
    const signedContracts = await signers();
    const { signer } = signedContracts;
    // The hash we wish to sign and verify
    const messageHash = ethers.utils.id(message);
    const messageHashBytes = ethers.utils.arrayify(messageHash);

    // Sign the binary data
    const flatSig = await signer.signMessage(messageHashBytes);
    // For Solidity, we need the expanded-format of a signature
    return flatSig;
  };

  async function calculateQR() {
    try {
      setErr("");
      const signedsecondHalf = await createSplitSignature(props.tokenId);
      setQr(`${props.tokenId}-${signedsecondHalf}`);
      setShow(true);
    } catch (error) {
      console.log(error);
      error.data === undefined
        ? setErr(error.message)
        : setErr(error.data.message);
    }
  }

  const downloadQR = () => {
    const qrCodeURL = document
      .getElementById("qrCode")
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    console.log(qrCodeURL);

    let doc = new jsPDF("portrait", "px", "a4", "false");
    //first param is margin, second param is length down
    doc.text(60, 60, `Event: ${props.event} `);
    doc.text(60, 80, `Ticket: ${props.ticket} `);
    doc.addImage(qrCodeURL, "PNG", 180, 100, 100, 100);
    doc.setFontSize(8);
    doc.text(2, 210, `${qr} `);

    // doc.text(60, 60, `Event: ${props.event} `);
    // doc.text(60, 80, `Ticket: ${props.ticket} `);
    // doc.addImage(qrCodeURL, "PNG", 100, 130, 200, 200);
    doc.save("ticket.pdf");
  };

  return (
    <div>
      {!show ? (
        <div className="container text-center">
          <button
            onClick={calculateQR}
            style={{ backgroundColor: "#eee8a9" }}
            className="btn text-dark p-4 fw-bold shadow-lg"
          >
            Click to Reveal QR Code
          </button>
          <p className=" text-danger mt-3">{err}</p>
        </div>
      ) : (
        <>
          <div className="flex justify-center">
            <Qrcode className="m-4 h-44 w-44" id="qrCode" value={qr} />
          </div>
          <div className="btn-group">
            <button
              type="button"
              onClick={downloadQR}
              className="btn btn-primary"
            >
              Download Ticket
            </button>
            <button
              type="button"
              onClick={() => setShow(false)}
              className="btn btn-outline-primary"
            >
              Hide Ticket
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default QR;
