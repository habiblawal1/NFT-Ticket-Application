// SPDX-License-Identifier: MIT
 pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import '@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';

import "hardhat/console.sol";

contract TicketMarket is ERC1155Holder{
  using Counters for Counters.Counter;
  //counters start at 0 
  Counters.Counter private _ticketIds;
  Counters.Counter private _eventIds;

  //Used by tutorial as an address to receive listing fees - can't charge people as this is a FYP project unfortunately
  address payable owner;

  mapping(uint256 => MarketEvent) private idToMarketEvent;
  mapping(uint256 => MarketTicket) private idToMarketTicket;

  struct MarketEvent {
    uint eventId;
    string uri;
    uint64 startDate;
    address owner;
  }

  struct MarketTicket {
    uint256 tokenId;
    uint256 ticketId;
    uint eventId;
    address payable seller;
    address payable owner;
    uint256 price;
    uint256 purchaseLimit;
    uint256 totalSupply;
    bool sold;
  }

  event MarketEventCreated (
    uint indexed eventId,
    string uri,
    uint64 startDate,
    address owner
  );

  event MarketTicketCreated (
    uint indexed tokenId,
    uint indexed ticketId,
    uint indexed eventId,
    address seller,
    address owner,
    uint256 price,
    uint256 purchaseLimit,
    uint256 totalSupply,
    bool sold
  );
//TODO - Create function to edit event start date
  /* Places an item for sale on the marketplace */
  function createEvent(
    string memory uri, uint64 startDate
  ) public returns (uint) {
      // check if thic fucntion caller is not an zero address account
    require(msg.sender != address(0));
    require((uint64(block.timestamp) < startDate), "Date has already passed");
    _eventIds.increment();

    uint256 eventId = _eventIds.current();
  
    idToMarketEvent[eventId] =  MarketEvent(
      eventId,
      uri,
      startDate,
      msg.sender
    );

    emit MarketEventCreated(
      eventId,
      uri,
      startDate,
      msg.sender
    );

    return eventId;
  }

/* Places a ticket for sale on the marketplace */
  function createMarketTicket(
    uint256 eventId,
    uint256 tokenId,
    address nftContract,
    uint256 purchaseLimit,
    uint256 totalSupply,
    uint256 price
  ) public returns (uint) {
    require(price > 0, "Price must be at least 1 wei");
    //check user owns NFT before listing it on the market
    require(IERC1155(nftContract).balanceOf(msg.sender, tokenId)>= totalSupply, "You do not own the NFT ticket you are trying to list");
    //check msg sender owns event
    require(idToMarketEvent[eventId].owner == msg.sender, "You do not own this event");
    //Check event has not already passed
    require((uint64(block.timestamp) < idToMarketEvent[eventId].startDate), "Event has already passed");
    
    _ticketIds.increment();
    uint256 ticketId = _ticketIds.current();
    //seller is the person putting it for sale and owner is no one as the ticket is up for sale
    idToMarketTicket[ticketId] =  MarketTicket(
      tokenId,
      ticketId,
      eventId,
      payable(msg.sender),
      payable(address(0)),
      price,
      purchaseLimit,
      totalSupply,
      false
    );

    IERC1155(nftContract).safeTransferFrom(msg.sender, address(this), tokenId, totalSupply, "");
    emit MarketTicketCreated(
      tokenId,
      ticketId,
      eventId,
      msg.sender,
      address(0),
      price,
      purchaseLimit,
      totalSupply,
      false
    );
    return ticketId;
  }

  function buyTicket(
    address nftContract,
    uint256 ticketId,
    uint256 amount
    ) public payable {
    uint price = idToMarketTicket[ticketId].price;
    uint tokenId = idToMarketTicket[ticketId].tokenId;
    uint limit = idToMarketTicket[ticketId].purchaseLimit;
    address seller = idToMarketTicket[ticketId].seller;
    require(IERC1155(nftContract).balanceOf(address(this), ticketId) >=1 , "From must be owner");
    require(amount <= IERC1155(nftContract).balanceOf(address(this), ticketId), "Not enough tickets remaining on the marketplace");
    require(amount <= limit - IERC1155(nftContract).balanceOf(msg.sender, ticketId), "You have exceeded the maximum amount of tickets you are allowed to purchase");
    require(msg.value == price * amount, "Not enough money sent");
    //make sure the event hasn't started
    require((uint64(block.timestamp) < idToMarketEvent[idToMarketTicket[ticketId].eventId].startDate), "Event has already passed");
    idToMarketTicket[ticketId].owner = payable(msg.sender);
    idToMarketTicket[ticketId].sold = true;
    idToMarketTicket[ticketId].seller = payable(address(0));

    IERC1155(nftContract).safeTransferFrom(address(this), msg.sender, tokenId, amount, "");
    payable(seller).transfer(msg.value);
  }

  /* Getters */

  /* A view doesn't do any transactional stuff, i think its used when u return stuff idk */
  /* Returns only events that a user has created */
  function getMyEvents() public view returns (MarketEvent[] memory) {
    uint totalEventCount = _eventIds.current();
    uint eventCount = 0;
    uint currentIndex = 0;

    for (uint i = 0; i < totalEventCount; i++) {
      if (idToMarketEvent[i + 1].owner == msg.sender) {
        eventCount += 1;
      }
    }

    MarketEvent[] memory userEvents = new MarketEvent[](eventCount);
    for (uint i = 0; i < totalEventCount; i++) {
      if (idToMarketEvent[i + 1].owner == msg.sender) {
        uint currentId = i + 1;
        MarketEvent storage currentEvent = idToMarketEvent[currentId];
        userEvents[currentIndex] = currentEvent;
        currentIndex += 1;
      }
    }
    return userEvents;
  }

   function getAllEvents() public view returns (MarketEvent[] memory) {
    uint totalEventCount = _eventIds.current();
    uint eventCount = 0;
    uint currentIndex = 0;

    for (uint i = 0; i < totalEventCount; i++) {
      if ((uint64(block.timestamp) < idToMarketEvent[i+1].startDate)) {
        eventCount += 1;
      }
    }
    MarketEvent[] memory userEvents = new MarketEvent[](eventCount);
    for (uint i = 0; i < totalEventCount; i++) {
      if ((uint64(block.timestamp) < idToMarketEvent[i+1].startDate)) {
        uint currentId = i + 1;
        MarketEvent storage currentEvent = idToMarketEvent[currentId];
        userEvents[currentIndex] = currentEvent;
        currentIndex += 1;
      }
    }
    return userEvents;
   }
   
   function getEventTickets(uint256 _eventId) public view returns (MarketTicket[] memory) {
    uint totalTicketCount = _ticketIds.current();
    uint ticketCount = 0;
    uint currentIndex = 0;

    for (uint i = 0; i < totalTicketCount; i++) {
      if (idToMarketTicket[i + 1].eventId == _eventId && idToMarketTicket[i + 1].owner == address(0)) {
        ticketCount += 1;
      }
    }

    MarketTicket[] memory userTickets = new MarketTicket[](ticketCount);
    for (uint i = 0; i < totalTicketCount; i++) {
      if (idToMarketTicket[i + 1].eventId == _eventId && idToMarketTicket[i + 1].owner == address(0)) {
        uint currentId = i + 1;
        MarketTicket storage currentTicket = idToMarketTicket[currentId];
        userTickets[currentIndex] = currentTicket;
        currentIndex += 1;
      }
    }
    return userTickets;
   }

   function getMyTickets() public view returns (MarketTicket[] memory) {
    uint totalTicketCount = _ticketIds.current();
    uint ticketCount = 0;
    uint currentIndex = 0;

    for (uint i = 0; i < totalTicketCount; i++) {
      if (idToMarketTicket[i + 1].owner == msg.sender) {
        ticketCount += 1;
      }
    }

    MarketTicket[] memory userTickets = new MarketTicket[](ticketCount);
    for (uint i = 0; i < totalTicketCount; i++) {
      if (idToMarketTicket[i + 1].owner == msg.sender) {
        uint currentId = i + 1;
        MarketTicket storage currentTicket = idToMarketTicket[currentId];
        userTickets[currentIndex] = currentTicket;
        currentIndex += 1;
      }
    }
    return userTickets;
  }

  //   // TODO - I don't think this is needed
  // function getEventUri(uint256 eventId) public view returns (string memory) {
  //     require(bytes(idToMarketEvent[eventId].uri).length != 0, "No uri exists for the event, please create one using the setEventUri function");
  //     return(idToMarketEvent[eventId].uri);
  // }

  // function setEventUri(uint256 eventId, string memory uri) public{
  //     //allow you to only ever set the token uri once by requiring that the string mapped to the tokenId is empty
  //     //TODO - Add check to ensure event ID exists
  //     //TODO - Decide if I need to actually give a min number of times I can set event URI, for now so I'm not stuck on blocker, I'm making it immutable so you can't modify events, but need to decide what to do QUICK
  //     //require(bytes(_uris[tokenId]).length == 0, "You cannot set token uri twice");
  //     //TODO - Can I do the thing they did in the NFT paper strings where common custom checks were done elsewhere and then you can include them in the header of other functions. I could do this with the event owner check re
  //     require(idToMarketEvent[eventId].owner == msg.sender, "You do not own this event");
  //     idToMarketEvent[eventId].uri = uri;
  // }

  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155Receiver) returns (bool) {
      return super.supportsInterface(interfaceId);
  }

}

   

   








/**
    Will have purchase NFT Ticket by taking ID of ticket type you want to buy and amount as parameters
    This function will check that the marketplace has enough balance of the NFT for the amount you want to purchase
    You check if the buyer sent a moeney and transer from the marketplace address which is "address(this)" to buyer

    The marketplace will call the event contract and ticket contract to make new versions of each - or maybe event isn't needed and can be stored in marketplace
    I will append the new ticket to ticket array, then I will set the tickets ID to its place in the array. Ticket constructer will have marketplace address, and ticket script will have createToken
    function which takes in tokenID, amount, eventID

    We'll have a var called total tickets which is set to tickets array length
    We'll also have a var called ticket supply which is the available tickets we for an event which event owner has ability to change by being able to add extra or remove extra tickets
    To modifiy a ticket supply, I will have the ticket contract have modify function which takes the ticket ID and either creates the extra amount, or deletes extra amount if 

    The user will be miniting the nft themselves so we can keep track of original owner and this will get transferrred to the marketplace immediately in the nft contract.
    Then our code will pass these details to the marketplace contract which keeps track of the nftcontract in order to transfer the nft to the market address, and to know the token id and creator
    NFT is minted first, then we go to the market and create the market ticket

    STORE EVENTS
    To store tickets and events I can loop through map each time, then check if each index is free. Think I need to give users the option to burn tickets. Maybe
    also find a way to delete all unpurchased events after data of event passes
    I think its best to remove any events the day after it has occured, but I could still keep the ticket type. Mainly because its very inefficient 
    to loop through a long list of events to see which ones are still happening or not

    To get events tickets availiable just loop through each ticketID in the event's ticket array, than add to a counter the balance the marketplace has of that token/ticket

    EVENT CONTRACT
    He has an array of tickets which has a datatype of things like price etc. Then when someoen buys a ticket, a new ticket type is created and given the id of its place in the array,
    and then a new NFT is minted and its tokenID is the place in the array of the ticket, and the minted owner of the nft is the purchaser

    OTHER GUYS CONTRACT
    Each NFT has its own script associated with it, so when someone creates a token, they are also creating a new NFT contract
    He has a mapping of ids->MarketTicket to store all the market items in the market. Each item as its own market item id and a seperate token ID
    TokenID is given with a counter within the nft contract

    As user has access to the NFT contract and can mint the NFT, 
    Set approval for all gives another contract(e.g. our marketplace) the ability transfact the token to differen users.
    We also return the token id so that in the front end we can do stuff with the token id such as put it for sale

    So to list an item on the market, a user will interact with the front ent and he mints the nft, then we transfer that nft from the user to the marketplace

    balanceOf checks the quantity of a specific token that a contract has x


    OLD TICKET CONTRACT NOTES
     Marketplace{
        All events

    }

    Event{
        Name
        Description
        Start Date
        Creator
    }

    Ticket{
        Event ID
        Price
        Owner
        *Availability
    }



    *Create an empty event
    *We must map all the events to the correct creater

    //Withdraw is used to make sure you are the only one who can withdraw from a contract

    Ticket contract just mints the required amount of your asset with an ID alongside it, e.g. 1 for SWORD, 2 for ARMOUR
    https://www.youtube.com/watch?v=PakCemMvY58&list=LL&index=20
 */

