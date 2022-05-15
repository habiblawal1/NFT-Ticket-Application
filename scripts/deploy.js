// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

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
