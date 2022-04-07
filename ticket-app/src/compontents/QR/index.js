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
    doc.setFontSize(8.2);
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
          className="font-bold mt-4 bg-blue-500 text-white rounded p-4 shadow-lg"
        >
          Click to Reveal QR Code
        </button>
      ) : (
        <div>
          <Qrcode id="qrCode" value={qr} />
          <button
            onClick={downloadQR}
            className="font-bold mt-4 bg-blue-500 text-white rounded p-4 shadow-lg"
          >
            Download Ticket
          </button>
          <button
            onClick={() => setShow(false)}
            className="font-bold mt-4 bg-blue-500 text-white rounded p-4 shadow-lg"
          >
            Hide Ticket
          </button>
          <h1>{qr}</h1>
        </div>
      )}
    </div>
  );
};

export default QR;
