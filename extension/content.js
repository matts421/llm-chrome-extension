// content.js

const script = document.createElement("script");
script.src = chrome.runtime.getURL("inject.js");
script.type = "module";
document.documentElement.prepend(script);

window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  // Panel wants stored tokens
  if (event.data.type === "REQUEST_TOKEN_DATA") {
    chrome.storage.local.get(["totalTokenCount"], (result) => {
      window.postMessage({
        type: "TOKEN_DATA",
        value: result.totalTokenCount,
      });
    });
  }

  // From inject.js → backend
  if (event.data.type === "ADD_TOKENS") {
    chrome.runtime.sendMessage({
      action: "addTokens",
      value: event.data.value,
    });
  }
});

// Keep the panel updated when chrome.storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.totalTokenCount) {
    window.postMessage({
      type: "TOKEN_DATA",
      value: changes.totalTokenCount.newValue,
    });
  }
});

async function getFileText(file) {
  const url = chrome.runtime.getURL(file);
  const response = await fetch(url);
  return await response.text();
}

async function injectPanel() {
  const font = new FontFace(
    "Inter",
    `url('${chrome.runtime.getURL("fonts/Inter.ttf")})'`,
  );
  document.fonts.add(font);

  const panelId = "my-extension-panel";
  if (document.getElementById(panelId)) return;

  document.documentElement.style.marginRight = "33%";
  document.documentElement.style.transition = "margin-right 0.3s ease";

  const htmlText = await getFileText("panel.html");

  const panel = document.createElement("div");
  panel.id = panelId;
  panel.innerHTML = htmlText;
  document.body.appendChild(panel);

  // Inject Chart.js first
  const chartScript = document.createElement("script");
  chartScript.src = chrome.runtime.getURL("lib/chart.umd.min.js");
  panel.appendChild(chartScript);

  chartScript.onload = () => {
    const panelScript = document.createElement("script");
    panelScript.type = "module";
    panelScript.src = chrome.runtime.getURL("panel.js");
    panel.appendChild(panelScript);
  };

  const images = [
    await getFileText("img/slide1.svg"),
    await getFileText("img/slide2.svg"),
    await getFileText("img/slide3.svg"),
  ];
  let currentIndex = 0;

  function updateImage() {
    galleryImage.innerHTML = images[currentIndex];
  }

  const galleryImage = document.getElementById("gallery-image-container");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  // Navigate left
  prevBtn.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateImage();
  });

  // Navigate right
  nextBtn.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % images.length;
    updateImage();
  });

  // Auto-slide every 3 seconds
  let autoSlide = setInterval(() => {
    currentIndex = (currentIndex + 1) % images.length;
    updateImage();
  }, 5000);

  //Pause on hover
  galleryImage.addEventListener("mouseenter", () => clearInterval(autoSlide));
  galleryImage.addEventListener("mouseleave", () => {
    autoSlide = setInterval(() => {
      currentIndex = (currentIndex + 1) % images.length;
      updateImage();
    }, 5000);
  });

  // Initialize gallery
  updateImage();
}

if (document.body) {
  injectPanel();
} else window.addEventListener("DOMContentLoaded", injectPanel);
