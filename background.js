// Calculator - Background Script
// Developed by Nasri Ayari

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: "calculateGrades" });
});

// Handle popup messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getActiveTab") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "getGradeStatus" }, (response) => {
          sendResponse(response || { status: "not_calculated" });
        });
      } else {
        sendResponse({ status: "no_tab" });
      }
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === "calculateGrades") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "calculateGrades" });
      }
    });
  }
  
  if (request.action === "exportGrades") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "exportGrades" });
      }
    });
  }
});
