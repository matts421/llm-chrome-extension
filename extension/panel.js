import { dateToString } from "./lib/utils.js";

let GOAL = 1000;
let tokenChart = null;
let dateSkip = 1;
let tokens = null;

function createTokenChart(ctx, labels, values) {
  const dataBar = {
    label: "Tokens",
    data: values,
    backgroundColor: "#939090",
    borderWidth: 1,
    borderRadius: 0,
    order: 1,
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
    order: 0,
  };

  tokenChart = new Chart(ctx, {
    type: "bar",
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
              return index % dateSkip === 0 ? this.getLabelForValue(value) : "";
            },
          },
        },
        y: {
          beginAtZero: true,
          title: { display: false },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}

const TIME_RANGE = Object.freeze({
  DAY: "D",
  WEEK: "W",
  MONTH: "M",
});
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
let currentState = TIME_RANGE.DAY;
let num_vals = 24;

function aggregateDays(value, n) {
  const today = new Date();
  const dailyTotals = {};

  // Aggregate day counts
  for (const [key, count] of Object.entries(value)) {
    const day = key.slice(0, 8);
    dailyTotals[day] = (dailyTotals[day] || 0) + count;
  }

  // Last n days
  const values = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dayKey = dateToString(d).slice(0, 8);
    values.push(dailyTotals[dayKey] || 0);
  }
  return values;
}

function createDayData(value) {
  const now = dateToString(new Date()).slice(0, 8);

  const labels = Array.from({ length: 24 }, (_, i) => `${i}`);
  const values = labels.map((hour) => {
    const key = `${now}${hour.padStart(2, "0")}`;
    return value[key] ?? 0;
  });

  return [labels, values];
}

function createMonthData(value) {
  const values = aggregateDays(value, 30);

  const today = new Date();
  const labels = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (29 - i));
    return `${d.getDate()}`;
  });

  return [labels, values];
}

function createWeekData(value) {
  const currDayOfWeek = new Date().getDay();
  const mod = (m, n) => ((m % n) + n) % n;

  const labels = Array.from(
    { length: 7 },
    (_, i) => DAYS_OF_WEEK[mod(currDayOfWeek - 6 + i, 7)],
  );
  const values = aggregateDays(value, 7);
  return [labels, values];
}

function updateDisplay() {
  const ctx = document.getElementById("tokenChart").getContext("2d");
  let labels = [];
  let values = [];

  switch (currentState) {
    case TIME_RANGE.DAY:
      [labels, values] = createDayData(tokens);
      dateSkip = 4;
      num_vals = 24;
      break;
    case TIME_RANGE.WEEK:
      [labels, values] = createWeekData(tokens);
      dateSkip = 1;
      num_vals = 7;
      break;
    case TIME_RANGE.MONTH:
      [labels, values] = createMonthData(tokens);
      dateSkip = 7;
      num_vals = 30;
      break;
  }

  if (tokenChart) {
    tokenChart.data.labels = labels;
    tokenChart.data.datasets[0].data = values;
    tokenChart.data.datasets[1].data = Array(num_vals).fill(GOAL);
    tokenChart.update({ duration: 800, easing: "easeOutQuart" });
  } else {
    createTokenChart(ctx, labels, values);
  }
}

const dayButton = document.getElementById("day-button");
const weekButton = document.getElementById("week-button");
const monthButton = document.getElementById("month-button");

dayButton.addEventListener("click", () => {
  dayButton.style.backgroundColor = "rgba(217, 217, 217, 1)";
  weekButton.style.backgroundColor = "#f2f2f2";
  monthButton.style.backgroundColor = "#f2f2f2";

  currentState = TIME_RANGE.DAY;
  updateDisplay();
});

weekButton.addEventListener("click", () => {
  dayButton.style.backgroundColor = "#f2f2f2";
  weekButton.style.backgroundColor = "rgba(217, 217, 217, 1)";
  monthButton.style.backgroundColor = "#f2f2f2";

  currentState = TIME_RANGE.WEEK;
  updateDisplay();
});

monthButton.addEventListener("click", () => {
  dayButton.style.backgroundColor = "#f2f2f2";
  weekButton.style.backgroundColor = "#f2f2f2";
  monthButton.style.backgroundColor = "rgba(217, 217, 217, 1)";

  currentState = TIME_RANGE.MONTH;
  updateDisplay();
});

// Set goal

const goalInput = document.getElementById("goal-input");

function setGoal() {
  const newGoal = parseFloat(goalInput.value);
  if (isNaN(newGoal) || newGoal <= 0) {
    alert("Please enter a valid goal!");
    return;
  }
  GOAL = newGoal;
  tokenChart.data.datasets[1].data = Array(num_vals).fill(newGoal);
  tokenChart.update({ duration: 800, easing: "easeOutQuart" });
}

// Press Enter inside input
goalInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    setGoal();
  }
});

/* ---------------- MESSAGE BRIDGE ---------------- */

// Listen for messages from content.js
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data.type === "TOKEN_DATA") {
    tokens = event.data.value;
    updateDisplay();
  }
});

// Request data when the panel loads
window.postMessage({ type: "REQUEST_TOKEN_DATA" });
