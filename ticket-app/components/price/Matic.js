import { server } from "../../config";
const Matic = async (price) => {
  try {
    if (!price || price == "0") {
      return 0;
    }
    // const res = await fetch(`${server}/api/conversion/matic/${price}`);
    // const data = await res.json();
    // if (res.status == 500) {
    //   throw new Error(data.error);
    // }
    // return data.matic;
    return `${parseInt(price) - 2}`;
  } catch (error) {
    console.error(error.message);
    return 0;
  }
};

export default Matic;
