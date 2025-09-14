// // Save the original fetch
// const originalFetch = window.fetch;

// window.fetch = async function (input, init) {
//   // Check if the URL matches ChatGPT's conversation API
//   let url = input;
//   if (input instanceof Request) {
//     url = input.url;
//   }

//   if (url === "https://chatgpt.com/backend-api/f/conversation") {
//     console.log("[Interceptor] Request URL:", url);
//     if (init?.body) {
//       try {
//         const jsonBody = JSON.parse(init.body);
//         console.log("[Interceptor] Request body:", jsonBody);
//       } catch {}
//     }
//   }

//   const response = await originalFetch(input, init);

//   // Clone the response to read it
//   if (url === "https://chatgpt.com/backend-api/f/conversation") {
//     const cloned = response.clone();
//     cloned.text().then((text) => {
//       console.log("[Interceptor] Response body:", text);
//     });
//   }
//
function estimateTokens(text) {
  return Math.ceil(text.trim().length / 4);
}

// inject.js
(function () {
  const targetUrl = "https://chatgpt.com/backend-api/f/conversation";

  // Save original fetch
  const originalFetch = window.fetch;

  // Override fetch
  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : input.url;

    // Only intercept exact target URL
    if (url === targetUrl) {
      let totalTokens = 0;

      if (
        (typeof input === "string" && input === targetUrl) ||
        (input instanceof Request && input.url === targetUrl)
      ) {
        try {
          const req = JSON.parse(init.body);
          const prompt = req.messages.reduce((mAcc, message) => {
            return mAcc + message.content.parts.join(" ");
          }, "");
          console.log("[Interceptor] Prompt:", prompt);
          totalTokens += estimateTokens(prompt);
        } catch {}
      }

      const response = await originalFetch(input, init);

      // Clone response so page can still use it
      const responseClone = response.clone();

      // Stream reader
      const reader = responseClone.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText = "";

      async function readStream() {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunkText = decoder.decode(value, { stream: true });
          fullText += chunkText;
        }

        let output = "";
        let model = "";
        const dataPrefix = "data: ";

        fullText
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.startsWith(dataPrefix))
          .map((line) => line.replace(dataPrefix, ""))
          .forEach((jsonStr) => {
            try {
              const res = JSON.parse(jsonStr);
              const vBody = res.v;

              if (vBody !== undefined) {
                if (Array.isArray(vBody)) {
                  output += vBody[0]?.v ?? "";
                } else if (typeof vBody === "string") {
                  output += vBody;
                }
              } else if (res.type === "server_ste_metadata") {
                model = res.metadata?.model_slug ?? "";
              }
            } catch {}
          });

        console.log("[Interceptor] Model:", model);
        console.log("[Interceptor] Response:", output);
        totalTokens += estimateTokens(output);
        console.log("tokens:", totalTokens);
        window.postMessage({ type: "ADD_TOKENS", value: totalTokens }, "*");
      }

      readStream(); // start streaming

      return response; // return original response to page
    }

    // Not our URL, use normal fetch
    return originalFetch(input, init);
  };
})();
