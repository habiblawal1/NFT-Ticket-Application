// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

const handler = async (req, res) => {
  // res.status(200).json({ name: "John Doe" });

  try {
    const price = req.query.price;
    const repsonse = await fetch(
      `https://pro-api.coinmarketcap.com/v2/tools/price-conversion?amount=${price}&id=2791&convert=MATIC`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": process.env.COIN_MARKET_CAP_API,
        },
      }
    );
    const results = await repsonse.json();
    if (!results.data) {
      throw new Error(results.status.error_message);
    }
    const matic = results.data.quote.MATIC.price.toFixed(2);
    res.status(200).json({ matic });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export default handler;
