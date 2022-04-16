# COM3001

## IERC1155Receiver

Not all contracts support ERC1155 tokens, so in order for a contract to be able to support the token it must have the IERC1155Receiver interface. This what the **onERC1155Received** and **onERC1155BatchReceived** are implemented from, you need these in order for the contract to be able to receive ERC1155 tokens. This function is called at the end of a safeTransferFrom after the balance has been updated. To accept the transfer, this must return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)")) (i.e. 0xf23a6e61, or its own function selector

## ERC165

Its used to see if another contract that you are talking to implements a certain interface. Again its another must have requirement for the conctract to be able to receive ERC1155 tokens.

## Next JS Code Notes

- Props.children are used to apply something to all things within the tag E.g. you make a layout component and wrap some elements arounds it by doing <-Layout->myText<-/Layout->, to access the things within the layout tags, when defining your component you access it through props.children
- Web3Modal = A way for us to connect to someone's ethereum wallet
- Abis = JSON reperesentative of our smart contract. It allows us to interact with the smart contract from a client side application

## Tailwind Notes

- border-b = bottom border
- h-28 = height of 28
- flex = makes the whole section go to the right
- flex justify cenre willl give max space between items
- flex items.center = centre an item
- p-6 = padding of 6
- text-4xl = Setting the size of text, 4xl is 4 times extra large
- mt-4 = margin top size 5
- Justufy-center centers all elwmwnnts within tag
- maxWidth is how big it'll stretch for the screen size
- "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4" = If theres a small screen we'll show 2 cokumns and if its wide then 4 columns, and if really small then 1 column

Mount = if a component is mounted it means it's added to the ui. Basically means initialising something

Mount - Component Intitialized

Update - State changed

Unmount - Component Destroyed

## React Hooks

useState

- use to change state (variables) in response to something happening
- Allows you to keep up with local state

useCallBack:

- decides when a function should be re-rendered or if an old version should just be used
- used so to wrap the function so is not recreated unnecessarily and causing infinite loops
- when something in the array [] changes, the function is re-rendered, if array is empty, the function will only ever get rendered once and then be re-used

useReducer

- used to manage multiple states using the Redux pattern
- Instead of updating the state directly, you dispatch actions that go to a reducer function, and that reducer function deermines how to compute the next state
- useReducer is used insted of useState when you have more complicated state or interconnected state

useHistory

- Keep track of browser histort
- history.push('url') pushes a new location to the stack and redirects you there. By pushing instead replace you can go back after navigation

useParams

- useParamas give us access to dynamic segments of urls e.g. the value of /:userId

useEffect

- Allows you to invoke a function when a component loads

- allows us to run some logic when a dependency changes
- best used wen you want to do something as soon as the state changes
- If no array is added the the function within useEffect will get run anytime when mounted or state changes (if the function actually changes the state then it would result in an infinite loop)
- whenever one of the []array depencies in useEffect(() => {}, []) changes then the {}function exucutes
- If an empty array [] is passed the function is only euun when mounted
- run logic when component re-renders and can be used to run cleanup logic when component unmounts
- if you add a return statement the the return statement is only run just before the component is unmounted

useRef

- stores data across re-render cycles
- Used when you have a value that changes, but don't want it to re-render the UI
- Also used for when you want to grab an element from the DOM

useContext

- with context you can share the same data with multiple different components in your app without using props
- you wrap the parts of the application that should be ablee to use the context with the tags

Hook YT tutorial

- https://www.youtube.com/watch?v=TNhaISOUy6Q

## Redux

Redux is a pattern and library for managing and updating application state, using events called "actions"

Redux helps you manage "global" state - state that is needed across many parts of your application.
