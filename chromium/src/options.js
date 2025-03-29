import { storeWebAddr } from "./module.js";

"use strict";

const webAddr = document.getElementById("web-addr");

const updateUI = (settings) => {
    if (settings.web_addr === undefined || settings.web_addr === "") {
        storeWebAddr(webAddr.value);
        return;
    };
    webAddr.value = settings.web_addr;
};

chrome.storage.local.get().then(updateUI);

webAddr.addEventListener("change", () => storeWebAddr(webAddr.value));
