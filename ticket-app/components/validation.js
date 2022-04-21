export const positiveInt = (arr) => {
  arr.forEach((num) => {
    if (!(Number.isInteger(Number(num)) && Number(num) >= 0)) {
      throw new Error("Please ensure inputs are not negative integers");
    }
  });
};
