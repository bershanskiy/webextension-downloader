import { stores } from "./popup/utils";

const registerContextMenu = async () => {
  return new Promise<void>((resolve, reject) => {
    chrome.contextMenus.create({
      title: 'Download this extension',
      contexts: ['all'],
      documentUrlPatterns: stores.map(({detailsURLPrefix}) => `${detailsURLPrefix}*`),
      id: 'download',
    }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
};

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  await chrome.contextMenus.removeAll();
  await registerContextMenu();
});
