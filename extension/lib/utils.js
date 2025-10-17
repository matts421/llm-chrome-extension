// export function daysBetween(start, end) {
//   const startDate = new Date(start);
//   const endDate = new Date(end);
//   startDate.setHours(0, 0, 0, 0);
//   endDate.setHours(0, 0, 0, 0);
//   return Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
// }

// export function formatDate(date) {
//   const d = new Date(date);
//   d.setHours(0, 0, 0, 0);
//   return d.toISOString().split("T")[0];
// }

// export function parseLocalDate(dateStr) {
//   const [year, month, day] = dateStr.split("-").map(Number);
//   return new Date(year, month - 1, day);
// }

const stringToDayHour = (s) =>
  new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), +s.slice(8, 10));

export const dateToString = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  return `${yyyy}${mm}${dd}${hh}`;
};

export function isWithinDays(d, numDays) {
  const now = new Date();
  const diffTime = now - d;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays < numDays;
}

export function updateTokens(current, incomingTokens) {
  let newTokens = Object.fromEntries(
    Object.entries(current)
      .filter(([key]) => key !== "minDate" && key !== "values")
      .filter(([dayHour]) => isWithinDays(stringToDayHour(dayHour), 30)),
  );
  const now = dateToString(new Date());
  newTokens[now] = (newTokens[now] ?? 0) + incomingTokens;

  return newTokens;
}

export function initTokens() {
  return {};
}

export function estimateTokens(text) {
  return Math.ceil(text.trim().length / 4);
}
