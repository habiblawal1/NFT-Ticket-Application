function TestPage({ matic, error }) {
  //API only works in server side, in order for it to work on client side you need to edit the next.config.js
  //https://frontend-digest.com/environment-variables-in-next-js-9a272f0bf655
  //https://stackoverflow.com/questions/66137368/next-js-environment-variables-are-undefined-next-js-10-0-5
  const myAPI = process.env.COIN_MARKET_CAP_API;
  console.log("API = ", myAPI);
  !error ? console.log(matic) : console.log(error);
  return (
    <div>
      <h1>Me testing out Next.JS</h1>
      {/* {characters.map((character) => {
          return <li key={character.id}>{character.name}</li>;
        })} */}
    </div>
  );
}

export const getStaticProps = async () => {
  //ID 2791 is the id for GBP, have to use ID as there's to GBPs, Great British Pound and Good Boy Points
  const res = await fetch(
    "https://pro-api.coinmarketcap.com/v2/tools/price-conversion?amount=55&id=2791&convert=MATIC",
    {
      headers: {
        "X-CMC_PRO_API_KEY": process.env.COIN_MARKET_CAP_API,
      },
    }
  );
  const results = await res.json();
  if (!results.data) {
    return {
      props: {
        matic: -1,
        error: results.status.error_message,
      },
    };
  }

  return {
    props: {
      matic: results.data.quote.MATIC.price,
      error: "",
    },
  };
};

export default TestPage;
