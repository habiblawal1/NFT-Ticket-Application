import { BigNumber } from "@ethersproject/bignumber";
import { expect } from "chai";
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
        "Asian Nights",
        "Come Rubix this saturday to have fun",
        "https://www.google.com/imgres?imgurl=https%3A%2F%2Fwww.lawdonut.co.uk%2Fsites%2Fdefault%2Ffiles%2Fchristmas_parties.jpg&imgrefurl=https%3A%2F%2Fwww.lawdonut.co.uk%2Fpersonal%2Fblog%2F19%2F12%2Foffice-christmas-party-employers-dos-and-donts&tbnid=Y-FwqdAMIIvizM&vet=12ahUKEwj1jdzhzbT2AhVpiIsKHZ_XCL0QMygJegUIARDsAQ..i&docid=_pB8B9JlB_JWAM&w=1148&h=696&q=party&client=safari&ved=2ahUKEwj1jdzhzbT2AhVpiIsKHZ_XCL0QMygJegUIARDsAQ",
        "Union House, University Of Surrey, Stag Hill, University Campus, Guildford GU2 7XH",
        Math.floor(new Date("2022-03-25").getTime() / 1000)
      );
    let eventId = await createEventEvent.wait();
    eventId = eventId.events[0].args.eventId.toNumber();

    const createEventEvent2 = await market
      .connect(sellerAddress2)
      .createEvent(
        "Chelsea vs Arsenal",
        "The big derby game to watch Chelsea vs Arsenal at Stamford Bride",
        "https://www.google.com/imgres?imgurl=https%3A%2F%2Fwww.lawdonut.co.uk%2Fsites%2Fdefault%2Ffiles%2Fchristmas_parties.jpg&imgrefurl=https%3A%2F%2Fwww.lawdonut.co.uk%2Fpersonal%2Fblog%2F19%2F12%2Foffice-christmas-party-employers-dos-and-donts&tbnid=Y-FwqdAMIIvizM&vet=12ahUKEwj1jdzhzbT2AhVpiIsKHZ_XCL0QMygJegUIARDsAQ..i&docid=_pB8B9JlB_JWAM&w=1148&h=696&q=party&client=safari&ved=2ahUKEwj1jdzhzbT2AhVpiIsKHZ_XCL0QMygJegUIARDsAQ",
        "Fulham Rd., London SW6 1HS",
        Math.floor(new Date("2022-03-25").getTime() / 1000)
      );
    let eventId2 = await createEventEvent.wait();
    eventId = eventId2.events[0].args.eventId.toNumber();

    const createTokenEvent = await nft
      .connect(sellerAddress)
      .createToken(10, eventId);
    let tokenId = await createTokenEvent.wait();
    tokenId.events.forEach((element: any) => {
      if (element.event == "NFTTicketCreated") {
        tokenId = element.args.tokenId.toNumber();
      }
    });

    /*
    int64 amount, 
    uint256 eventId, 
    uint256 purchaseLimit, 
    uint256 price
    */
    const createMarketEvent = await market
      .connect(sellerAddress)
      .createMarketTicket(eventId, tokenId, nftContract, 4, 10, ticketPrice);
    let ticketId = await createMarketEvent.wait();
    ticketId.events.forEach((element: any) => {
      if (element.event == "MarketTicketCreated") {
        ticketId = element.args.ticketId.toNumber();
      }
    });

    await market
      .connect(buyerAddress)
      .buyTicket(nftContract, ticketId, 2, { value: ticketPrice.mul(2) });

    const myNfts = await nft.balanceOf(buyerAddress.address, tokenId);
    console.log("Buyer's NFTs = ", myNfts.toString());
    let allEvents = await market.getAllEvents();
    allEvents = await Promise.all(
      allEvents.map(
        async (i: {
          eventId: BigNumber;
          name: string;
          description: string;
          imageUri: string;
          location: string;
          eventStartDate: BigNumber;
          owner: string;
        }): Promise<any> => {
          let _event = {
            eventId: i.eventId.toString(),
            name: i.name,
            description: i.description,
            imageUri: i.imageUri,
            location: i.location,
            eventStartDate: new Date(
              i.eventStartDate.toNumber() * 1000
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
          name: string;
          description: string;
          imageUri: string;
          location: string;
          eventStartDate: BigNumber;
          owner: string;
        }): Promise<any> => {
          let _event = {
            eventId: i.eventId.toString(),
            name: i.name,
            description: i.description,
            imageUri: i.imageUri,
            location: i.location,
            eventStartDate: new Date(
              i.eventStartDate.toNumber() * 1000
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
          let _ticket = {
            tokenId: i.tokenId.toString(),
            eventId: i.eventId.toString(),
            seller: i.seller,
            owner: i.owner,
            price: i.price.toString(),
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
