export function getMaxNum(data, key) {
  let num = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i][key] > num) {
      num = data[i][key]
    }
  }
  return num;
}