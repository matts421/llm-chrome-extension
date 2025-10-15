/*
START HELPER FUNCTIONS
*/
function daysBetween(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  return Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
}

function formatDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function updateTokenArray(current, incomingTokens) {
  const newMin = getNewMin(new Date());
  const dayDiff = daysBetween(parseLocalDate(current.minDate), newMin);

  let newValues = current.values.slice(dayDiff).concat(Array(dayDiff).fill(0));
  newValues[newValues.length - 1] += incomingTokens;

  return {
    minDate: formatDate(newMin),
    values: newValues,
  };
}

function getNewMin(date) {
  const newMin = new Date(date);
  newMin.setDate(date.getDate() - 30);
  return newMin;
}

function createTotalTokenCount() {
  return {
    minDate: formatDate(getNewMin(new Date())),
    values: Array(30).fill(0),
  };
}
/*
END HELPER FUNCTIONS
*/
