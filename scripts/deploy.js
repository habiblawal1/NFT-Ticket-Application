async function main() {
  // We get the contract to deploy
  const Market = await ethers.getContractFactory("TicketMarket");
  const market = await Market.deploy();
  await market.deployed();
  const marketAddress = market.address;
  console.log("TicketMarket Contract deployed to:", marketAddress);

  const NFT = await ethers.getContractFactory("NFTTicket");
  const nft = await NFT.deploy(marketAddress);
  await nft.deployed();
  const nftContract = nft.address;
  console.log("NFTTicket Contract deployed to:", nftContract);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
