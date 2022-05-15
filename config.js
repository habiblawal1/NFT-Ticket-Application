//Local Node Test Addresses
// export const nftaddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
// export const nftmarketaddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// export const nftaddress = "0x55bEE48806F2c935B5Bc6e364d1082d85E13cdE8";
// export const nftmarketaddress = "0x26C7cb8d07D92C742b310C02716E726823C1Dc47";

export const nftmarketaddress = "0x7a8436A983707bA99813d21d0C7d0d035D5eaD21";
export const nftaddress = "0x5Dde79546585866d45f73405B942cb0a2FB9F1D4";

const dev = process.env.NODE_ENV !== "production";
export const server = dev
  ? "http://localhost:3000"
  : "https://nfticketing.vercel.app";
