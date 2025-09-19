const script = document.createElement("script");
script.src = chrome.runtime.getURL("inject.js");
script.type = "module";
document.documentElement.prepend(script);

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data.type === "ADD_TOKENS") {
    chrome.runtime.sendMessage({
      action: "addTokens",
      value: event.data.value,
    });
  }
});
