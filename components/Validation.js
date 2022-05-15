export const positiveInt = (arr) => {
  arr.forEach((num) => {
    if (!(Number.isInteger(Number(num)) && Number(num) >= 0)) {
      throw new Error("Please ensure inputs are not negative integers");
    }
  });
};

function getExtension(filename) {
  const parts = filename.split(".");
  return parts[parts.length - 1];
}

export function isValidImage(filename) {
  const ext = getExtension(filename);
  switch (ext.toLowerCase()) {
    case "jpg":
    case "jpeg":
    case "gif":
    case "png":
      return true;
  }
  return false;
}
