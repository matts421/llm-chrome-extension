import { updateTokens, initTokens } from "./lib/utils.js";

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

chrome.runtime.onMessage.addListener((msg, _sender, _sendResponse) => {
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
      let current = result.totalTokenCount || initTokens();

      chrome.storage.local.set(
        {
          totalTokenCount: updateTokens(current, msg.value),
        },
        () => {},
      );
    });
  }

  if (msg.action === "updateGoal") {
    getOrCreateUserId((userId) => {
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, "0");
      const timestamp =
        `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
        `:${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

      const data = {
        uuid: userId,
        timestamp: timestamp,
        goal: msg.value,
      };

      fetch("https://llm-chrome-extension.onrender.com/goal", {
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
          console.log("Successfully sent goal data:", json);
        })
        .catch((err) => {
          console.error("Error sending goal data:", err);
        });
    });

    chrome.storage.local.set({ tokenGoal: msg.value }, () => {});
  }
});
