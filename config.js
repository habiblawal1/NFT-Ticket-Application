//Local Node Test Addresses
// export const nftaddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
// export const nftmarketaddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// export const nftmarketaddress = "0xD542F8f9fc40d4038AEab4CF151FD93AbEA775D0";
// export const nftaddress = "0x03Ea715E4061a0676DF074d270d4aAE7ac98bE24";

export const nftmarketaddress = "0xb29f8654AB112Faf5C0D3F00DA60F1714212B200";
export const nftaddress = "0xbA43A2c5bF07230beFC88C0B6759b31045a113e3";

const dev = process.env.NODE_ENV !== "production";
export const server = dev
  ? "http://localhost:3000"
  : "https://nfticketing.vercel.app";
