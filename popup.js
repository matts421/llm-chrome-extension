// popup.js
// document.getElementById("readBtn").addEventListener("click", () => {
//   chrome.storage.local.get(["totalTokenCount"], (result) => {
//     document.getElementById("output").innerText = result.totalTokenCount || 0;
//   });
// });

function updateDisplay(value) {
  document.getElementById("output").innerText = value || 0;
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
