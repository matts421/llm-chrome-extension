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
    data: [],
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

function updateTokenText(title, count) {
  let countText = document.getElementById("summary-text-count");
  let titleText = document.getElementById("summary-text-title");
  let goalCountText = document.getElementById("summary-text-goal-count");

  goalCountText.innerHTML = `<b>${GOAL.toLocaleString()}</b> tokens per day`;

  if (title == null && count == null) {
    title = titleText.textContent;
    count = Number(countText.textContent.split(" ")[0].replace(/[^\d.-]/g, ""));
  } else {
    updateMetrics(count);
  }

  titleText.textContent = title;
  countText.innerHTML = `<b>${count.toLocaleString()}</b> tokens`;
  const diff = count - GOAL;

  let diffElement = document.getElementById("summary-text-diff");
  if (currentState == TIME_RANGE.DAY) {
    diffElement.textContent = `${diff <= 0 ? "▼" : "▲"} ${Math.abs(diff).toLocaleString()}`;
    diffElement.style.color = diff <= 0 ? "rgb(62, 164, 75)" : "#FF0000";
  } else {
    diffElement.textContent = "";
  }
}

function computeSum(values) {
  return values.reduce((acc, value) => acc + value, 0);
}

function updateMetrics(count) {
  const watermL = 0.32 * (count / 500);
  const elecWh = 0.34 * (count / 500);

  const waterPeople = (800_000_000 * watermL) / (1300 * 365);
  const homes = (800_000_000 * elecWh) / (11_135 * 1000);

  let waterHeader = document.getElementById("water-count");
  let waterText = document.getElementById("water-text");
  waterHeader.textContent = `${watermL.toFixed(2)} mL`;
  waterText.innerHTML =
    `Collectively<b class="tiny-text">*</b>, that's enough drinking water to last ` +
    `<b>${Math.round(waterPeople).toLocaleString()}</b> people for an entire year.` +
    `<br><br><b class="tiny-text">*</b>across all ChatGPT users`;

  let elecHeader = document.getElementById("electricity-count");
  let elecText = document.getElementById("electricity-text");
  elecHeader.textContent = `${elecWh.toFixed(2)} Wh`;
  elecText.innerHTML =
    `Collectively<b class="tiny-text">*</b>, that's enough energy to power ` +
    `<b>${Math.round(homes).toLocaleString()}</b> homes for an entire year.` +
    `<br><br><b class="tiny-text">*</b>across all ChatGPT users`;
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
      updateTokenText("Total", computeSum(values));
      break;
    case TIME_RANGE.WEEK:
      [labels, values] = createWeekData(tokens);
      dateSkip = 1;
      num_vals = 7;
      updateTokenText("Average", (computeSum(values) / 7).toFixed(2));
      break;
    case TIME_RANGE.MONTH:
      [labels, values] = createMonthData(tokens);
      dateSkip = 7;
      num_vals = 30;
      updateTokenText("Average", (computeSum(values) / 30).toFixed(2));
      break;
  }

  if (tokenChart) {
    tokenChart.data.labels = labels;
    tokenChart.data.datasets[0].data = values;
    if (currentState == TIME_RANGE.DAY) {
      tokenChart.data.datasets[1].data = [];
    } else {
      tokenChart.data.datasets[1].data = Array(num_vals).fill(GOAL);
    }
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
const goalButton = document.getElementById("token-enter-button");

function setGoal() {
  const newGoal = parseFloat(goalInput.value);
  if (isNaN(newGoal) || newGoal <= 0) {
    alert("Please enter a valid goal!");
    return;
  }
  GOAL = newGoal;
  window.postMessage({ type: "UPDATE_TOKEN_GOAL", value: GOAL });

  if (currentState == TIME_RANGE.DAY) {
    tokenChart.data.datasets[1].data = [];
  } else {
    tokenChart.data.datasets[1].data = Array(num_vals).fill(GOAL);
  }
  tokenChart.update({ duration: 800, easing: "easeOutQuart" });
  updateTokenText(null, null);
}
goalButton.addEventListener("click", (_) => {
  setGoal();
});

/* ---------------- MESSAGE BRIDGE ---------------- */

// Listen for messages from content.js
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data.type === "TOKEN_DATA") {
    tokens = event.data.value;
    updateDisplay();
  }

  if (event.data.type === "GOAL_DATA") {
    GOAL = event.data.value;
    updateDisplay();
  }
});

// Request data when the panel loads
window.postMessage({ type: "REQUEST_TOKEN_DATA" });
window.postMessage({ type: "REQUEST_GOAL_DATA" });
