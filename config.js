//Local Node Test Addresses
// export const nftaddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
// export const nftmarketaddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// export const nftaddress = "0x55bEE48806F2c935B5Bc6e364d1082d85E13cdE8";
// export const nftmarketaddress = "0x26C7cb8d07D92C742b310C02716E726823C1Dc47";

// export const nftmarketaddress = "0x7a8436A983707bA99813d21d0C7d0d035D5eaD21";
// export const nftaddress = "0x5Dde79546585866d45f73405B942cb0a2FB9F1D4";

// export const nftmarketaddress = "0xC67343CAffd07388274cc40a9a344212b2287E4a";
// export const nftaddress = "0xd084dd18E0555544a3B85513c3E3f1C87A6c958B";

// TicketMarket Contract deployed to: 0xC67343CAffd07388274cc40a9a344212b2287E4a
// NFTTicket Contract deployed to: 0xd084dd18E0555544a3B85513c3E3f1C87A6c958B

export const nftmarketaddress = "0xD542F8f9fc40d4038AEab4CF151FD93AbEA775D0";
export const nftaddress = "0x03Ea715E4061a0676DF074d270d4aAE7ac98bE24";

// TicketMarket Contract deployed to: 0xD542F8f9fc40d4038AEab4CF151FD93AbEA775D0
// NFTTicket Contract deployed to: 0x03Ea715E4061a0676DF074d270d4aAE7ac98bE24
const dev = process.env.NODE_ENV !== "production";
export const server = dev
  ? "http://localhost:3000"
  : "https://nfticketing.vercel.app";
