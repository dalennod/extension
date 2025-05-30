import { existsIconPaths, defaultIconPaths } from "./module.js";
import { checkUrl, setCurrentTab, storeWebAddr, getAPIEndpoint } from "./module.js";

"use strict";

const tabActivated = (activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, async (tab) => {
        setCurrentTab(tab.url);
        await setIcon();
    });
};

const tabUpdated = async (tabId, changeInfo, tab) => {
    if (changeInfo.url) setCurrentTab(await tab.url);
    await setIcon();
};

const setIcon = async () => {
    if (await getAPIEndpoint() === undefined) await storeWebAddr();
    const response = await checkUrl();
    if (response.status === 404) await chrome.action.setIcon({ path: defaultIconPaths });
    else                         await chrome.action.setIcon({ path: existsIconPaths  });
};

chrome.tabs.onActivated.addListener(tabActivated);
chrome.tabs.onUpdated.addListener(tabUpdated);
chrome.runtime.onInstalled.addListener(storeWebAddr);
