// function TestPage({ characters }) {
//   return (
//     <div>
//       <h1>Me testing out Next.JS</h1>
//       {characters.map((character) => {
//         return <li key={character.id}>{character.name}</li>;
//       })}
//     </div>
//   );
// }

// export const getStaticProps = async (context) => {
//   const res = await fetch("https://rickandmortyapi.com/api/character");
//   const { results } = await res.json();

//   return {
//     props: {
//       characters: results,
//     },
//   };
// };

function TestPage({ characters }) {
  console.log(characters);
  return (
    <div>
      <h1>Me testing out Next.JS</h1>
      {/* {characters.map((character) => {
        return <li key={character.id}>{character.name}</li>;
      })} */}
    </div>
  );
}

export const getStaticProps = async (context) => {
  try {
    const res = await fetch(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
      {
        headers: {
          "X-CMC_PRO_API_KEY": "3fc892a3-c59b-481e-8520-dda7c0ea479b",
        },
      }
    );
    const results = await res.json();
    return {
      props: {
        characters: results,
      },
    };
  } catch (error) {
    console.error(error);
  }
};

export default TestPage;
