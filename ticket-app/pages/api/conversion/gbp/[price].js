const handler = async (req, res) => {
  try {
    const price = req.query.price;
    //3890 is the ID for MATIC
    const repsonse = await fetch(
      `https://pro-api.coinmarketcap.com/v2/tools/price-conversion?amount=${price}&id=3890&convert=GBP`,
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
    const gbp = results.data.quote.GBP.price.toFixed(2);
    res.status(200).json({ gbp });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export default handler;
