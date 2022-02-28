


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

    EVENT CONTRACT
    He has an array of tickets which has a datatype of things like price etc. Then when someoen buys a ticket, a new ticket type is created and given the id of its place in the array,
    and then a new NFT is minted and its tokenID is the place in the array of the ticket, and the minted owner of the nft is the purchaser

    OTHER GUYS CONTRACT
    Each NFT has its own script associated with it, so when someone creates a token, they are also creating a new NFT contract
    He has a mapping of ids->marketItem to store all the market items in the market. Each item as its own market item id and a seperate token ID
    TokenID is given with a counter within the nft contract

    As user has access to the NFT contract and can mint the NFT, 
    Set approval for all gives another contract(e.g. our marketplace) the ability transfact the token to differen users.
    We also return the token id so that in the front end we can do stuff with the token id such as put it for sale

    So to list an item on the market, a user will interact with the front ent and he mints the nft, then we transfer that nft from the user to the marketplace
 */



 IF(SS){
     A =BBB
     X=5
 }ELSE{
     X=5
 }