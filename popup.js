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
    minDate: getNewMin(new Date()),
    values: Array(30).fill(0),
  };
}
/*
END HELPER FUNCTIONS
*/

function updateDisplay(value) {
  if (value === undefined) {
    value = createTotalTokenCount();
  }
  const newValue = updateTokenArray(value, 0);

  const ctx = document.getElementById("tokenChart").getContext("2d");

  const startDate = parseLocalDate(newValue.minDate);
  const labels = Array.from({ length: newValue.values.length }, (_, i) => {
    let d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return formatDate(d);
  });
  const values = newValue.values;

  const tokenChart = new Chart(ctx, {
    type: "line", // or 'bar', 'pie', etc.
    data: {
      labels: labels, // x-axis (dates)
      datasets: [
        {
          label: "Tokens per Day",
          data: values, // y-axis
          backgroundColor: "rgba(66, 133, 244, 0.2)",
          borderColor: "rgba(66, 133, 244, 1)",
          borderWidth: 2,
          fill: true,
          tension: 0.2, // smooth curves
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: "Date",
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Tokens",
          },
        },
      },
    },
  });
}

// Initial read when popup opens
chrome.storage.local.get(["totalTokenCount"], (result) => {
  updateDisplay(result.totalTokenCount);
});

// Listen for changes in storage while popup is open
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.totalTokenCount) {
    updateDisplay(changes.totalTokenCount.newValue);
  }
});
