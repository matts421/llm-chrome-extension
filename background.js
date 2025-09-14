// chrome.webRequest.onBeforeRequest.addListener(
//   (details) => {
//     if (details.method === "POST") {
//       try {
//         const body = details.requestBody?.raw?.[0]?.bytes;
//         if (body) {
//           const text = new TextDecoder("utf-8").decode(body);
//           const data = JSON.parse(text);

//           console.log("[EXT] Request:", data);
//           // You can store it or send to popup
//           chrome.storage.local.set({ lastRequest: data });
//         }
//       } catch (e) {
//         console.error("[EXT] Failed to parse request body", e);
//       }
//     }
//   },
//   { urls: ["https://chatgpt.com/backend-api/f/conversation"] },
//   ["requestBody"],
// );

// chrome.webRequest.onCompleted.addListener(
//   async (details) => {
//     console.log("[EXT] Response completed:", details);
//     // You could fetch the response if you want via fetch override or leave as is
//   },
//   { urls: ["https://chatgpt.com/backend-api/f/conversation"] },
// );
//

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "addTokens") {
    console.log("got here");
    chrome.storage.local.get(["totalTokenCount"], (result) => {
      const current = result.totalTokenCount || 0;
      const updated = current + msg.value;
      chrome.storage.local.set({ totalTokenCount: updated }, () => {});
    });
  }
});
