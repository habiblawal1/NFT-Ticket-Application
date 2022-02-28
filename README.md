# COM3001

## IERC1155Receiver

Not all contracts support ERC1155 tokens, so in order for a contract to be able to support the token it must have the IERC1155Receiver interface. This what the **onERC1155Received** and **onERC1155BatchReceived** are implemented from, you need these in order for the contract to be able to receive ERC1155 tokens. This function is called at the end of a safeTransferFrom after the balance has been updated. To accept the transfer, this must return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)")) (i.e. 0xf23a6e61, or its own function selector

## ERC165

Its used to see if another contract that you are talking to implements a certain interface. Again its another must have requirement for the conctract to be able to receive ERC1155 tokens.

//TODO
How do I solve issue if multiple users hacking the system by creating loads of duplicate events - I guess by showing eventID which can't be duplicated
