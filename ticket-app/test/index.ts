import { BigNumber } from "@ethersproject/bignumber";
import { ethers } from "hardhat";

describe("Market", function () {
  it("It should create events, tickets, and execute ticket sales", async function () {
    const Market = await ethers.getContractFactory("TicketMarket");
    const market = await Market.deploy();
    await market.deployed();
    const marketAddress = market.address;

    const NFT = await ethers.getContractFactory("NFTTicket");
    const nft = await NFT.deploy(marketAddress);
    await nft.deployed();
    const nftContract = nft.address;

    //A way to get test addresses. The first address is the deployment address so we ignore it with a "_"
    const [_, buyerAddress, sellerAddress, sellerAddress2] =
      await ethers.getSigners();

    //this method allows us to deal with whole units instead of wei. In here its not 100 ether, its 100 matic (1MATIC = 1.3GBP).
    const ticketPrice = ethers.utils.parseUnits("100", "ether");

    //your_string

    /*
    string name,
    string description,
    string imageUri,
    string location,
    uint64 eventStartDate
    */
    const createEventEvent = await market
      .connect(sellerAddress)
      .createEvent(
        "url/event/1.json",
        Math.floor(new Date("2022-05-15").getTime() / 1000)
      );
    let eventId = await createEventEvent.wait();
    console.log("EVENT 1", eventId.events[0].args);
    eventId = eventId.events[0].args.eventId.toNumber();
    //await market.connect(sellerAddress).setEventUri(eventId, "url/event/1.json");

    const createEventEvent2 = await market
      .connect(sellerAddress2)
      .createEvent(
        "url/event/2.json",
        Math.floor(new Date("2022-12-23").getTime() / 1000)
      );
    let eventId2 = await createEventEvent2.wait();
    console.log("EVENT 2", eventId2.events[0].args);
    eventId2 = eventId2.events[0].args.eventId.toNumber();
    //await market.connect(sellerAddress2).setEventUri(eventId2, "url/event/2.json");

    const createTokenEvent = await nft.connect(sellerAddress).createToken(10);
    let tokenId = await createTokenEvent.wait();
    tokenId.events.forEach((element: any) => {
      if (element.event == "NFTTicketCreated") {
        tokenId = element.args.tokenId.toNumber();
      }
    });
    await nft.connect(sellerAddress).setTokenUri(1, "url/1.json");
    const nftURI = await nft.uri(1);
    console.log("URI For Token ID 1 =", nftURI);

    await market
      .connect(sellerAddress)
      .createMarketTicket(eventId, tokenId, nftContract, 4, 10, ticketPrice);

    await market
      .connect(buyerAddress)
      .buyTicket(nftContract, tokenId, 2, { value: ticketPrice.mul(2) });

    const myNfts = await nft.balanceOf(buyerAddress.address, tokenId);
    console.log("Buyer's NFTs = ", myNfts.toString());
    let allEvents = await market.getAllEvents();
    allEvents = await Promise.all(
      allEvents.map(
        async (i: {
          eventId: BigNumber;
          uri: string;
          startDate: BigNumber;
          owner: string;
        }): Promise<any> => {
          let _event = {
            eventId: i.eventId.toString(),
            uri: i.uri,
            startDate: new Date(
              i.startDate.toNumber() * 1000
            ).toLocaleDateString(),
            owner: i.owner,
          };
          return _event;
        }
      )
    );
    console.log("All Events: ", allEvents);

    let myEvents = await market.connect(sellerAddress).getMyEvents();
    myEvents = await Promise.all(
      myEvents.map(
        async (i: {
          eventId: BigNumber;
          uri: string;
          startDate: BigNumber;
          owner: string;
        }): Promise<any> => {
          let _event = {
            eventId: i.eventId.toString(),
            uri: i.uri,
            startDate: new Date(
              i.startDate.toNumber() * 1000
            ).toLocaleDateString(),
            owner: i.owner,
          };
          return _event;
        }
      )
    );
    console.log("My Events: ", myEvents);

    let myTickets = await market.connect(buyerAddress).getMyTickets();

    /**    uint256 tokenId;
    uint eventId;
    address payable seller;
    address payable owner;
    uint256 price;
    uint256 purchaseLimit;
    uint256 totalSupply;
    bool sold; */
    myTickets = await Promise.all(
      myTickets.map(
        async (i: {
          tokenId: BigNumber;
          eventId: BigNumber;
          seller: string;
          owner: string;
          price: BigNumber;
          purchaseLimit: BigNumber;
          totalSupply: BigNumber;
          sold: boolean;
        }): Promise<any> => {
          let price = ethers.utils.formatUnits(i.price.toString(), "ether");
          let _ticket = {
            tokenId: i.tokenId.toString(),
            eventId: i.eventId.toString(),
            seller: i.seller,
            owner: i.owner,
            price: `${price} MATIC`,
            purchaseLimit: i.purchaseLimit.toString(),
            totalSupply: i.totalSupply.toString(),
            sold: i.sold,
          };
          return _ticket;
        }
      )
    );
    console.log("My tickets: ", myTickets);
  });
});
