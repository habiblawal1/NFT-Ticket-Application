import { server } from "../../config";
const Pound = async (price) => {
  try {
    if (!price || !(Number.isInteger(Number(price)) && Number(price) > 0)) {
      return 0;
    }
    //   const res = await fetch(`${server}/api/conversion/gbp/${price}`);
    //   const data = await res.json();
    //   if (res.status == 500) {
    //     throw new Error(data.error);
    //   }
    // return data.gbp;
    return `${parseInt(price) + 2}`;
  } catch (error) {
    console.error(error.message);
    return 0;
  }
};

export default Pound;
