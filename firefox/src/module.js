"use strict";

const storeWebAddr = async (webAddr) => {
    const defaultWebAddr = "http://localhost:41415";
    if ((await browser.storage.local.get("web_addr")).web_addr === undefined) {
        await browser.storage.local.set({ web_addr: defaultWebAddr });
    } else {
        if (webAddr === "" || webAddr === undefined)
            await browser.storage.local.set({ web_addr: defaultWebAddr });
        else await browser.storage.local.set({ web_addr: webAddr });
    }
};

const getAPIEndpoint = async () => {
    const webAddr = await browser.storage.local.get("web_addr");
    if (webAddr.web_addr === undefined || typeof(webAddr.web_addr) === "object") return;
    else return webAddr.web_addr + "/api/";
};

const existsIconPaths = {
    48: "icons/exists/dalennod-exists-48.png",
    96: "icons/exists/dalennod-exists-96.png",
};

const defaultIconPaths = {
    48: "icons/dalennod-48.png",
    96: "icons/dalennod-96.png",
};

let currentTab = "";
const setCurrentTab = (tabUrl) => {
    currentTab = tabUrl;
};

const checkUrl = async (url = currentTab) => {
    const API_ENDPOINT = await getAPIEndpoint();
    const fetchUrl = API_ENDPOINT + "check-url/";
    const r = await fetch(fetchUrl, {
        method: "POST",
        body: JSON.stringify({ url: url }),
    });
    return r;
};

export { storeWebAddr, getAPIEndpoint, existsIconPaths, defaultIconPaths, currentTab, setCurrentTab, checkUrl };
