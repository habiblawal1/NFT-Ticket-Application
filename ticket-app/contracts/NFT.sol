// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import "hardhat/console.sol";

contract NFT is ERC1155 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address contractAddress;

    //orginal uri for 1155 must end in {id}.json which is done to save gas, but this format isn't widely accepted e.g. not by opensea
    constructor(address marketplaceAddress) ERC1155(tokenURI) {
        contractAddress = marketplaceAddress;
    }

    function createToken(uint64 amount, uint256 eventId) public returns (uint) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        //use eventID for the metadata

        _mint(msg.sender, newItemId, amount, "");
        setApprovalForAll(contractAddress, true);
        return newItemId;
    }

    //What this function does is allow a custom uri for a token which doesn't need to follow {id} structure
    function uri(uint256 tokenID) override public view returns (string memory) {
        return(
            string(abi.encodePacked(
                "URI",
                Strings.toString(tokenID),
                ".json"
            ))
        );
    }
}

/**

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