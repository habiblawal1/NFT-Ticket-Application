import React from "react";
import Qrcode from "qrcode.react";
import jsPDF from "jspdf";
import { useState } from "react";
import { ethers } from "ethers";

import { signers } from "./Contracts";

const QR = (props) => {
  const [show, setShow] = useState(false);
  const [qr, setQr] = useState("");

  const createSplitSignature = async (message) => {
    const signedContracts = await signers();
    const { signer } = signedContracts;
    // The hash we wish to sign and verify
    const messageHash = ethers.utils.id(props.tokenId);
    // Note: messageHash is a string, that is 66-bytes long, to sign the
    //       binary value, we must convert it to the 32 byte Array that
    //       the string represents
    //
    // i.e.
    //   // 66-byte string
    //   "0x592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba"
    //
    //   ... vs ...
    //
    //  // 32 entry Uint8Array
    //  [ 89, 47, 167, 67, 136, 159, 199, 249, 42, 194, 163,
    //    123, 177, 245, 186, 29, 175, 42, 92, 132, 116, 28,
    //    160, 224, 6, 29, 36, 58, 46, 103, 7, 186]

    const messageHashBytes = ethers.utils.arrayify(messageHash);

    // Sign the binary data
    const flatSig = await signer.signMessage(messageHashBytes);
    // For Solidity, we need the expanded-format of a signature
    return flatSig;
  };

  async function calculateQR() {
    const signedsecondHalf = await createSplitSignature(props.tokenId);
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
          className="btn text-dark p-4 fw-bold shadow-lg"
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
