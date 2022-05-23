//Local Node Test Addresses
// export const nftaddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
// export const nftmarketaddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// export const nftmarketaddress = "0xD542F8f9fc40d4038AEab4CF151FD93AbEA775D0";
// export const nftaddress = "0x03Ea715E4061a0676DF074d270d4aAE7ac98bE24";

export const nftmarketaddress = "0xdbe31c39173bB483c4fdAC08047B417262C6fC55";
export const nftaddress = "0x6d0da96bedECe96015eb28b74d1E8B4BAfAE1497";

const dev = process.env.NODE_ENV !== "production";
export const server = dev
  ? "http://localhost:3000"
  : "https://nfticketing.vercel.app";
