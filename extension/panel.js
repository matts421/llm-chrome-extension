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

let GOAL = 1000;
let tokenChart = null;

function createTokenChart(ctx, labels, values) {
  const dataBar = {
    label: "Tokens",
    data: values,
    backgroundColor: "#939090",
    borderWidth: 1,
    borderRadius: 0,
    order: 0,
  };

  const goalLine = {
    label: "Goal",
    data: Array(values.length).fill(GOAL),
    borderColor: "rgba(0, 0, 0, 1)",
    borderWidth: 1,
    borderDash: [5, 5],
    fill: false,
    type: "line",
    pointRadius: 0,
    pointHoverRadius: 5,
    pointHitRadius: 10,
    order: 1,
  };

  tokenChart = new Chart(ctx, {
    type: "bar", // primary chart type
    data: {
      labels,
      datasets: [dataBar, goalLine],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: false },
          grid: { display: false },
          ticks: {
            font: { size: 8 },
            maxRotation: 0,
            minRotation: 0,
            autoSkip: false,
            display: true,
            callback: function (value, index) {
              return index % 7 === 0
                ? this.getLabelForValue(value).split("-")[2]
                : "";
            },
          },
        },
        y: {
          beginAtZero: true,
          title: { display: false, text: "Tokens" },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}

function updateDisplay(value) {
  if (!value) value = createTotalTokenCount();
  const newValue = updateTokenArray(value, 0);

  const ctx = document.getElementById("tokenChart").getContext("2d");
  const startDate = parseLocalDate(newValue.minDate);
  const labels = Array.from({ length: newValue.values.length }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return formatDate(d);
  });
  const values = newValue.values;

  if (tokenChart) {
    tokenChart.data.labels = labels;
    tokenChart.data.datasets[0].data = values;
    tokenChart.update({ duration: 800, easing: "easeOutQuart" });
  } else {
    createTokenChart(ctx, labels, values);
  }
}

// Set goal

const goalInput = document.getElementById("goal-input");

function setGoal() {
  const newGoal = parseFloat(goalInput.value);
  if (isNaN(newGoal) || newGoal <= 0) {
    alert("Please enter a valid goal!");
    return;
  }
  GOAL = newGoal;
  tokenChart.data.datasets[1].data = Array(30).fill(newGoal);
  tokenChart.update({ duration: 800, easing: "easeOutQuart" });
}

// Press Enter inside input
goalInput.addEventListener("keydown", (event) => {
  console.log(event);
  if (event.key === "Enter") {
    setGoal();
  }
});

/* ---------------- MESSAGE BRIDGE ---------------- */

// Listen for messages from content.js
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data.type === "TOKEN_DATA") {
    updateDisplay(event.data.value);
  }
});

// Request data when the panel loads
window.postMessage({ type: "REQUEST_TOKEN_DATA" });
