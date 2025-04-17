import { existsIconPaths, defaultIconPaths } from "./module.js";
import { checkUrl, setCurrentTab, storeWebAddr, getAPIEndpoint } from "./module.js";

"use strict";

const tabActivated = (activeInfo) => {
    browser.tabs.get(activeInfo.tabId, async (tab) => {
        setCurrentTab(await tab.url);
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
    if (response.status === 404) await browser.browserAction.setIcon({ path: defaultIconPaths });
    else                         await browser.browserAction.setIcon({ path: existsIconPaths  });
};

browser.tabs.onActivated.addListener(tabActivated);
browser.tabs.onUpdated.addListener(tabUpdated);
browser.runtime.onInstalled.addListener(storeWebAddr);
