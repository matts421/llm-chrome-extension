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

const GOAL = 1000; // TODO: edit this value

function createTokenChart(ctx, labels, values) {
  const goalLine = {
    label: "Goal",
    data: Array(values.length).fill(GOAL),
    borderColor: "rgba(255, 99, 132, 1)",
    borderWidth: 2,
    borderDash: [5, 5],
    fill: false,
    pointRadius: 0,
    pointHoverRadius: 5,
    pointHitRadius: 50,
    pointHoverBackgroundColor: "rgba(255, 99, 132, 1)",
  };
  const averageLine = {
    label: "Average",
    data: Array(values.length).fill(
      values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
    ),
    borderColor: "rgba(75, 192, 192, 1)",
    borderWidth: 2,
    borderDash: [5, 3],
    fill: false,
    pointRadius: 0,
    pointHoverRadius: 5,
    pointHitRadius: 50,
    pointHoverBackgroundColor: "rgba(75, 192, 192, 1)",
  };
  const dataLine = {
    label: "Tokens per Day",
    data: values,
    backgroundColor: "rgba(66, 133, 244, 0.2)",
    borderColor: "rgba(66, 133, 244, 1)",
    borderWidth: 2,
    fill: true,
    tension: 0.2,
  };

  tokenChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [dataLine, averageLine, goalLine],
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

let tokenChart = null;

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

  if (tokenChart) {
    tokenChart.data.labels = labels;
    tokenChart.data.datasets[0].data = values;
    tokenChart.update({
      duration: 800,
      easing: "easeOutQuart",
    });
  } else {
    createTokenChart(ctx, labels, values);
  }
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
