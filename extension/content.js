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

// === panel injection + robust pointer-based resizing ===
(function () {
  function injectPanel() {
    if (document.getElementById("gpt-stats-panel")) return;

    const panel = document.createElement("div");
    panel.id = "gpt-stats-panel";
    panel.innerHTML = `
      <div id="gpt-stats-header">
        <span>📊 GPT Stats</span>
      </div>
      <iframe id="gpt-stats-frame" src="${chrome.runtime.getURL("panel.html")}"></iframe>
      <div id="gpt-resizer" title="Drag to resize"></div>
      <div id="gpt-collapsed-tab" aria-hidden="false">📊</div>
    `;
    document.body.appendChild(panel);

    const resizer = panel.querySelector("#gpt-resizer");
    const collapsedTab = panel.querySelector("#gpt-collapsed-tab");
    panel.classList.add("collapsed");

    // Only start resizing when pointerdown happens ON THE RESIZER
    let isResizing = false;
    let activePointerId = null;
    const SNAP_THRESHOLD = 100; // px
    const MIN_WIDTH = 100; // px
    const MAX_RATIO = 0.9; // can't exceed 90% of viewport width

    // Use pointer events (work with mouse, touch, pen)
    resizer.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();

      isResizing = true;
      activePointerId = e.pointerId;

      // Capture pointer so pointermove events still come to resizer even when cursor is over iframe
      try {
        resizer.setPointerCapture(activePointerId);
      } catch (err) {
        // ignore if not supported
      }

      // Prevent text selection while resizing (robust cross-browser)
      document.documentElement.classList.add("resizing");
      resizer.classList.add("active");
    });

    // pointermove on document: only honored when isResizing === true and pointerId matches
    document.addEventListener("pointermove", (e) => {
      if (!isResizing || e.pointerId !== activePointerId) return;

      // distance from mouse to right edge (panel is right-aligned)
      const newWidth = Math.round(window.innerWidth - e.clientX);
      const maxWidth = Math.round(window.innerWidth * MAX_RATIO);

      if (newWidth <= SNAP_THRESHOLD) {
        // snap collapse
        panel.classList.add("collapsed");
        panel.style.width = "0px";
      } else {
        // expand to clamped width
        panel.classList.remove("collapsed");
        const clamped = Math.min(maxWidth, Math.max(MIN_WIDTH, newWidth));
        panel.style.width = clamped + "px";
      }
    });

    // stop resizing on pointerup / pointercancel
    function stopResize(e) {
      if (!isResizing) return;
      if (e && e.pointerId && e.pointerId !== activePointerId) return;

      try {
        resizer.releasePointerCapture(activePointerId);
      } catch (err) {}
      isResizing = false;
      activePointerId = null;
      document.documentElement.classList.remove("resizing");
      resizer.classList.remove("active");
    }
    document.addEventListener("pointerup", stopResize);
    document.addEventListener("pointercancel", stopResize);
    resizer.addEventListener("lostpointercapture", stopResize);

    // collapsed tab re-opens panel
    collapsedTab.addEventListener("click", (e) => {
      e.stopPropagation();
      panel.classList.remove("collapsed");
      panel.style.width = "400px";
    });
  }

  // Wait for body (works for document_start or document_idle)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectPanel);
  } else {
    injectPanel();
  }
})();
