import React from "react";
import Qrcode from "qrcode.react";
import jsPDF from "jspdf";
import { useState } from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";

const QR = (props) => {
  const [show, setShow] = useState(false);
  const [qr, setQr] = useState("");

  async function calculateQR() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    // const addr = await signer.getAddress();
    // const secondHalf = `${addr}-${props.tokenId}`;
    // console.log("Unsigned Second Half = ", secondHalf);
    // const signedsecondHalf = await signer.signMessage(secondHalf);
    // setQr(`${addr}-${signedsecondHalf}`);

    console.log("Unsigned Second Half = ", props.tokenId);
    const signedsecondHalf = await signer.signMessage(props.tokenId);
    setQr(`${props.tokenId}-${signedsecondHalf}`);
    setShow(true);
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
        <button
          onClick={calculateQR}
          style={{ backgroundColor: "#eee8a9" }}
          className="btn text-black p-4 fw-bold shadow-lg"
        >
          Click to Reveal QR Code
        </button>
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
