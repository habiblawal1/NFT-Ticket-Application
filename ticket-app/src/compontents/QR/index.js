import React from "react";
import Qrcode from "qrcode.react";

import { useState } from "react";
import { ethers, providers } from "ethers";
import Web3Modal from "web3modal";

const QR = (props) => {
  const [show, setShow] = useState(false);
  const [qr, setQr] = useState("");

  async function calculateQR() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const addr = await signer.getAddress();
    const secondHalf = `${addr}-${props.tokenId}`;
    console.log("Unsigned Second Half = ", secondHalf);
    const signedsecondHalf = await signer.signMessage(secondHalf);
    setQr(`${addr}-${signedsecondHalf}`);
    setShow(true);
  }

  const downloadQR = () => {
    alert("QR Downloaded");
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
          <Qrcode value={qr} />
          <a onClick={downloadQR}> Download </a>
          <h1>{qr}</h1>
        </div>
      )}
    </div>
  );
};

export default QR;
