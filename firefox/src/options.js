"use strict";

const webAddr = document.getElementById("web-addr");

const storeWebAddr = async () => {
    if (webAddr.value === "") webAddr.value = "http://localhost:41415";
    await browser.storage.local.set({ "web_addr": webAddr.value });
};

const updateUI = (settings) => {
    if (settings.web_addr === undefined || settings.web_addr === "") {
        storeWebAddr();
        return;
    };
    webAddr.value = settings.web_addr;
};

browser.storage.local.get().then(updateUI);

webAddr.addEventListener("change", storeWebAddr);
