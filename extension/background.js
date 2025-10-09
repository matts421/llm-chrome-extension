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

function getOrCreateUserId(callback) {
  chrome.storage.local.get(["userId"], (result) => {
    if (result.userId) {
      console.log("Existing userId:", result.userId);
      callback(result.userId);
    } else {
      const newUserId = crypto.randomUUID();
      chrome.storage.local.set({ userId: newUserId }, () => {
        console.log("Created new userId:", newUserId);
        callback(newUserId);
      });
    }
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "addTokens") {
    getOrCreateUserId((userId) => {
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, "0");
      const timestamp =
        `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
        `:${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

      const data = {
        uuid: userId,
        timestamp: timestamp,
        token_count: msg.value,
      };

      console.log("trying to send data: ", JSON.stringify(data));

      fetch("https://llm-chrome-extension.onrender.com/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then((response) => {
          if (!response.ok)
            throw new Error("Network response was not ok: " + response.status);
          return response.json();
        })
        .then((json) => {
          console.log("Successfully sent token data:", json);
        })
        .catch((err) => {
          console.error("Error sending token data:", err);
        });
    });

    chrome.storage.local.get(["totalTokenCount"], (result) => {
      let current = result.totalTokenCount || createTotalTokenCount();

      chrome.storage.local.set(
        {
          totalTokenCount: updateTokenArray(current, msg.value),
        },
        () => {},
      );
    });
  }
});
