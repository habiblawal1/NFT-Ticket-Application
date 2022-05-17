// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

import "hardhat/console.sol";

contract TicketMarket is ERC1155Holder {
    using Counters for Counters.Counter;
    //counters start at 0
    Counters.Counter private _ticketCount;
    Counters.Counter private _eventIds;
    Counters.Counter private _resaleIds;

    mapping(uint256 => MarketEvent) private idToMarketEvent;
    mapping(uint256 => MarketTicket) private idToMarketTicket;
    mapping(uint256 => ResaleTicket) private idToResaleTicket;
    mapping(uint256 => mapping(address => bool)) private idToValidated;

    struct MarketEvent {
        uint256 eventId;
        string uri;
        uint64 startDate;
        uint256 ticketTotal;
        uint256 ticketsSold;
        address payable owner;
    }

    struct MarketTicket {
        uint256 tokenId;
        uint256 eventId;
        uint256 price;
        uint256 purchaseLimit;
        uint256 totalSupply;
        uint256 royaltyFee;
        uint256 maxResalePrice;
    }

    struct ResaleTicket {
        uint256 resaleId;
        uint256 tokenId;
        address payable seller;
        uint256 resalePrice;
        bool sold;
    }

    event MarketEventCreated(
        uint256 indexed eventId,
        string uri,
        uint64 startDate,
        uint256 ticketTotal,
        uint256 ticketsSold,
        address owner
    );

    event MarketTicketCreated(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        uint256 price,
        uint256 purchaseLimit,
        uint256 totalSupply,
        uint256 royaltyFee,
        uint256 maxResalePrice
    );

    event ResaleTicketCreated(
        uint256 indexed resaleId,
        uint256 indexed tokenId,
        address seller,
        uint256 resalePrice,
        bool sold
    );

    event TicketValidated(uint256 indexed tokenId, address ownerAddress);

    /* Places an item for sale on the marketplace */
    function createEvent(string memory uri, uint64 startDate)
        public
        returns (uint256)
    {
        // check if thic fucntion caller is not an zero address account
        require(msg.sender != address(0));
        require(
            (uint64(block.timestamp) <= startDate),
            "Date has already passed"
        );
        _eventIds.increment();

        uint256 eventId = _eventIds.current();

        idToMarketEvent[eventId] = MarketEvent(
            eventId,
            uri,
            startDate,
            0,
            0,
            payable(msg.sender)
        );

        emit MarketEventCreated(eventId, uri, startDate, 0, 0, msg.sender);

        return eventId;
    }

    /* Places a ticket for sale on the marketplace */
    function createMarketTicket(
        uint256 eventId,
        uint256 tokenId,
        address nftContract,
        uint256 purchaseLimit,
        uint256 totalSupply,
        uint256 price,
        uint256 royaltyFee,
        uint256 maxResalePrice
    ) public {
        require(price > 0, "Price must be at least 1 wei");
        //check user owns NFT before listing it on the market
        require(
            IERC1155(nftContract).balanceOf(msg.sender, tokenId) >= totalSupply,
            "You do not own the NFT ticket you are trying to list"
        );
        //check msg sender owns event
        require(
            idToMarketEvent[eventId].owner == msg.sender,
            "You do not own this event"
        );
        //Check event has not already passed
        require(
            (uint64(block.timestamp) <= idToMarketEvent[eventId].startDate),
            "Event has already passed"
        );
        require(
            royaltyFee <= 100,
            "Royalty fee must be a percentage, therefore it can't be more than 100"
        );

        _ticketCount.increment();

        idToMarketTicket[tokenId] = MarketTicket(
            tokenId,
            eventId,
            price,
            purchaseLimit,
            totalSupply,
            royaltyFee,
            maxResalePrice
        );

        IERC1155(nftContract).safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            totalSupply,
            ""
        );
        idToMarketEvent[eventId].ticketTotal =
            idToMarketEvent[eventId].ticketTotal +
            totalSupply;

        emit MarketTicketCreated(
            tokenId,
            eventId,
            price,
            purchaseLimit,
            totalSupply,
            royaltyFee,
            maxResalePrice
        );
    }

    function addMoreTicketsToMarket(
        address nftContract,
        uint256 tokenId,
        uint256 amount
    ) public {
        uint256 eventId = idToMarketTicket[tokenId].eventId;
        //check user owns NFT before listing it on the market
        require(
            IERC1155(nftContract).balanceOf(msg.sender, tokenId) >= amount,
            "You do not own the NFT ticket you are trying to list"
        );
        //check msg sender owns event
        require(
            idToMarketEvent[eventId].owner == msg.sender,
            "You do not own this event"
        );
        //Check event has not already passed
        require(
            (uint64(block.timestamp) <= idToMarketEvent[eventId].startDate),
            "Event has already passed"
        );

        IERC1155(nftContract).safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            amount,
            ""
        );
        idToMarketEvent[eventId].ticketTotal =
            idToMarketEvent[eventId].ticketTotal +
            amount;
        idToMarketTicket[tokenId].totalSupply =
            idToMarketTicket[tokenId].totalSupply +
            amount;
    }

    function buyTicket(
        address nftContract,
        uint256 tokenId,
        uint256 amount
    ) public payable {
        uint256 price = idToMarketTicket[tokenId].price;
        uint256 limit = idToMarketTicket[tokenId].purchaseLimit;
        uint256 eventId = idToMarketTicket[tokenId].eventId;
        address eventOwner = idToMarketEvent[eventId].owner;
        require(
            amount <= IERC1155(nftContract).balanceOf(address(this), tokenId),
            "Not enough tickets remaining on the marketplace"
        );
        require(
            amount <=
                limit - IERC1155(nftContract).balanceOf(msg.sender, tokenId),
            "You have exceeded the maximum amount of tickets you are allowed to purchase"
        );
        require(
            msg.value == price * amount,
            "Correct amount of money was not sent"
        );
        //make sure the event hasn't started
        require(
            (uint64(block.timestamp) <= idToMarketEvent[eventId].startDate),
            "Event has already passed"
        );

        idToValidated[tokenId][msg.sender] = false;

        IERC1155(nftContract).safeTransferFrom(
            address(this),
            msg.sender,
            tokenId,
            amount,
            ""
        );
        idToMarketEvent[eventId].ticketsSold =
            idToMarketEvent[eventId].ticketsSold +
            amount;
        payable(eventOwner).transfer(msg.value);
    }

    function buyResaleTicket(address nftContract, uint256 _resaleId)
        public
        payable
    {
        uint256 price = idToResaleTicket[_resaleId].resalePrice;
        uint256 tokenId = idToResaleTicket[_resaleId].tokenId;
        uint256 limit = idToMarketTicket[tokenId].purchaseLimit;
        uint256 eventId = idToMarketTicket[tokenId].eventId;
        address seller = idToResaleTicket[_resaleId].seller;
        address eventOwner = idToMarketEvent[eventId].owner;
        uint256 royaltyPercentage = idToMarketTicket[tokenId].royaltyFee;
        require(
            !idToResaleTicket[_resaleId].sold,
            "This ticket is not currently being resold on the market"
        );
        require(
            limit - IERC1155(nftContract).balanceOf(msg.sender, tokenId) > 0,
            "You have exceeded the maximum amount of tickets you are allowed to purchase"
        );
        require(msg.value == price, "Correct amount of money was not sent");
        //make sure the event hasn't started
        require(
            (uint64(block.timestamp) <= idToMarketEvent[eventId].startDate),
            "Event has already passed"
        );

        idToValidated[tokenId][msg.sender] = false;

        IERC1155(nftContract).safeTransferFrom(
            address(this),
            msg.sender,
            tokenId,
            1,
            ""
        );
        idToResaleTicket[_resaleId].sold == true;

        uint256 _royaltyFee = (price / 100) * royaltyPercentage;
        uint256 _sellerFee = price - _royaltyFee;

        payable(seller).transfer(_sellerFee);
        payable(eventOwner).transfer(_royaltyFee);

        idToResaleTicket[_resaleId].sold = true;
    }

    function validateTicket(
        address nftContract,
        uint256 tokenId,
        bytes32 hash,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public returns (address) {
        //Only event owner can validate ticket
        require(
            idToMarketEvent[idToMarketTicket[tokenId].eventId].owner ==
                msg.sender,
            "You do not the own the event for the ticket trying to be validated"
        );

        //Get address from signature
        bytes32 messageDigest = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
        );

        address signatureAddress = ecrecover(messageDigest, v, r, s);

        //user must own token
        require(
            IERC1155(nftContract).balanceOf(signatureAddress, tokenId) > 0,
            "Address does not own token"
        );
        //Stops user from entering their ticket twice
        require(
            idToValidated[tokenId][signatureAddress] == false,
            "User has already validated ticket"
        );

        idToValidated[tokenId][signatureAddress] = true;

        emit TicketValidated(tokenId, signatureAddress);

        return signatureAddress;
    }

    function listOnResale(
        address nftContract,
        uint256 _tokenId,
        uint256 price
    ) public returns (uint256) {
        require(
            IERC1155(nftContract).balanceOf(msg.sender, _tokenId) > 0,
            "You do not own the ticket you are trying to list"
        );
        require(
            price <= idToMarketTicket[_tokenId].maxResalePrice,
            "Resale price should not exceed the max resale price for this ticket"
        );
        require(
            idToValidated[_tokenId][msg.sender] == false,
            "This ticket has already been used for event"
        );

        uint256 resaleId;
        uint256 totalIdCount = _resaleIds.current();

        uint256 currentIndex = 1;
        bool noSoldIds = true;

        //We loop through resaleMarket, if a resale item is sold, we use that id as the id for our new resale item and overwrite the old item
        while (noSoldIds && currentIndex <= totalIdCount) {
            if (idToResaleTicket[currentIndex].sold == true) {
                noSoldIds = false;
                resaleId = currentIndex;
            }
            currentIndex++;
        }
        if (noSoldIds) {
            _resaleIds.increment();
            resaleId = _resaleIds.current();
        }

        idToResaleTicket[resaleId] = ResaleTicket(
            resaleId,
            _tokenId,
            payable(msg.sender),
            price,
            false
        );

        IERC1155(nftContract).safeTransferFrom(
            msg.sender,
            address(this),
            _tokenId,
            1,
            ""
        );

        emit ResaleTicketCreated(resaleId, _tokenId, msg.sender, price, false);

        return resaleId;
    }

    /* Getters */

    function getEvent(uint256 _eventId)
        public
        view
        returns (MarketEvent memory)
    {
        require(
            idToMarketEvent[_eventId].eventId > 0,
            "This event does not exist"
        );
        return idToMarketEvent[_eventId];
    }

    /* Returns only events that a user has created */
    function getMyEvents() public view returns (MarketEvent[] memory) {
        uint256 totalEventCount = _eventIds.current();
        uint256 eventCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalEventCount; i++) {
            if (idToMarketEvent[i + 1].owner == msg.sender) {
                eventCount += 1;
            }
        }

        MarketEvent[] memory userEvents = new MarketEvent[](eventCount);
        for (uint256 i = 0; i < totalEventCount; i++) {
            if (idToMarketEvent[i + 1].owner == msg.sender) {
                uint256 currentId = i + 1;
                MarketEvent storage currentEvent = idToMarketEvent[currentId];
                userEvents[currentIndex] = currentEvent;
                currentIndex += 1;
            }
        }
        return userEvents;
    }

    function getAllEvents() public view returns (MarketEvent[] memory) {
        uint256 totalEventCount = _eventIds.current();
        uint256 eventCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalEventCount; i++) {
            if ((uint64(block.timestamp) <= idToMarketEvent[i + 1].startDate)) {
                eventCount += 1;
            }
        }
        MarketEvent[] memory userEvents = new MarketEvent[](eventCount);
        for (uint256 i = 0; i < totalEventCount; i++) {
            if ((uint64(block.timestamp) <= idToMarketEvent[i + 1].startDate)) {
                uint256 currentId = i + 1;
                MarketEvent storage currentEvent = idToMarketEvent[currentId];
                userEvents[currentIndex] = currentEvent;
                currentIndex += 1;
            }
        }
        return userEvents;
    }

    function getEventTickets(uint256 _eventId)
        public
        view
        returns (MarketTicket[] memory)
    {
        uint256 totalTicketCount = _ticketCount.current();
        uint256 ticketCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalTicketCount; i++) {
            if (idToMarketTicket[i + 1].eventId == _eventId) {
                ticketCount += 1;
            }
        }

        MarketTicket[] memory userTickets = new MarketTicket[](ticketCount);
        for (uint256 i = 0; i < totalTicketCount; i++) {
            if (idToMarketTicket[i + 1].eventId == _eventId) {
                uint256 currentId = i + 1;
                MarketTicket storage currentTicket = idToMarketTicket[
                    currentId
                ];
                userTickets[currentIndex] = currentTicket;
                currentIndex += 1;
            }
        }
        return userTickets;
    }

    function getMyTickets(address nftContract)
        public
        view
        returns (MarketTicket[] memory)
    {
        uint256 totalTicketCount = _ticketCount.current();
        uint256 ticketCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalTicketCount; i++) {
            if (
                IERC1155(nftContract).balanceOf(address(msg.sender), i + 1) >= 1
            ) {
                ticketCount += 1;
            }
        }

        MarketTicket[] memory userTickets = new MarketTicket[](ticketCount);
        for (uint256 i = 0; i < totalTicketCount; i++) {
            if (
                IERC1155(nftContract).balanceOf(address(msg.sender), i + 1) >= 1
            ) {
                uint256 currentId = i + 1;
                MarketTicket storage currentTicket = idToMarketTicket[
                    currentId
                ];
                userTickets[currentIndex] = currentTicket;
                currentIndex += 1;
            }
        }
        return userTickets;
    }

    function getMyResaleListings() public view returns (ResaleTicket[] memory) {
        uint256 totalTicketCount = _resaleIds.current();
        uint256 ticketCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalTicketCount; i++) {
            if (
                idToResaleTicket[i + 1].seller == msg.sender &&
                idToResaleTicket[i + 1].sold == false
            ) {
                ticketCount += 1;
            }
        }

        ResaleTicket[] memory resaleTickets = new ResaleTicket[](ticketCount);
        for (uint256 i = 0; i < totalTicketCount; i++) {
            if (
                idToResaleTicket[i + 1].seller == msg.sender &&
                idToResaleTicket[i + 1].sold == false
            ) {
                uint256 currentId = i + 1;
                ResaleTicket storage currentTicket = idToResaleTicket[
                    currentId
                ];
                resaleTickets[currentIndex] = currentTicket;
                currentIndex += 1;
            }
        }
        return resaleTickets;
    }

    function getResaleTickets(uint256 _tokenId)
        public
        view
        returns (ResaleTicket[] memory)
    {
        uint256 totalTicketCount = _resaleIds.current();
        uint256 ticketCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalTicketCount; i++) {
            if (
                idToResaleTicket[i + 1].tokenId == _tokenId &&
                idToResaleTicket[i + 1].sold == false
            ) {
                ticketCount += 1;
            }
        }

        ResaleTicket[] memory resaleTickets = new ResaleTicket[](ticketCount);
        for (uint256 i = 0; i < totalTicketCount; i++) {
            if (
                idToResaleTicket[i + 1].tokenId == _tokenId &&
                idToResaleTicket[i + 1].sold == false
            ) {
                uint256 currentId = i + 1;
                ResaleTicket storage currentTicket = idToResaleTicket[
                    currentId
                ];
                resaleTickets[currentIndex] = currentTicket;
                currentIndex += 1;
            }
        }
        return resaleTickets;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155Receiver)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
