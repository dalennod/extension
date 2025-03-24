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

let currentTab = "";
const setCurrentTab = (tabUrl) => {
    currentTab = tabUrl;
};

const checkUrl = async (url = currentTab) => {
    const fetchUrl = API_ENDPOINT + "check-url/";
    const res = await fetch(fetchUrl, {
        method: "POST",
        body: JSON.stringify({ url: url }),
    });
    return res;
};

export { API_ENDPOINT, existsIconPaths, defaultIconPaths, currentTab, setCurrentTab, checkUrl };
