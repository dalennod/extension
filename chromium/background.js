"use strict";

const API_ENDPOINT = "http://localhost:41415/api/";

const existsIconPaths = {
    48: "icons/exists/dalennod-exists-48.png",
    96: "icons/exists/dalennod-exists-96.png",
};
const defaultIconPaths = {
    48: "icons/dalennod-48.png",
    96: "icons/dalennod-96.png",
};

const checkUrl = async (currTabUrl) => {
    const fetchUrl = API_ENDPOINT + "check-url/";
    const res = await fetch(fetchUrl, {
        method: "POST",
        body: JSON.stringify({ url: currTabUrl }),
    });
    if (res.status === 404) {
        await chrome.action.setIcon({ path: defaultIconPaths });
        return;
    }
    await chrome.action.setIcon({ path: existsIconPaths });
};

let conn = false;
const checkConnection = async () => {
    if (!conn) {
        try {
            const fetchURL = API_ENDPOINT + "add/";
            const res = await fetch(fetchURL);
            // console.log(res.status, await res.text());
        } catch (err) {
            conn = false;
            console.error("server not running. ERROR:", err);
            return;
        }
        conn = true;
    }
    await checkUrl(currTab);
};

let currTab = "";
const tabActivated = (activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, async (tab) => {
        currTab = await tab.url;
        await checkConnection();
    });
};

const tabUpdated = async (tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        currTab = await tab.url;
        await checkConnection();
    }
};

chrome.tabs.onActivated.addListener(tabActivated);
chrome.tabs.onUpdated.addListener(tabUpdated);
