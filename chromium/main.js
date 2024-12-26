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

const [overlayDiv, overlayText, checkmark, archiveWarn, moreOptions, archiveLabel] = [document.getElementById("done-overlay-div"), document.getElementById("done-overlay-text"), document.getElementById("checkmark"), document.getElementById("archive-warn"), document.getElementById("more-options"), document.getElementById("input-archive-label")];
const [btnCreate, btnUpdate, btnRemove, btnArchive, btnRefetchThumbnail] = [ document.getElementById("button-add-req"), document.getElementById("button-update-req"), document.getElementById("button-remove-req"), document.getElementById("radio-btn-archive"), document.getElementById("button-refetch-thumbnail"), ];
const [bmId, inputUrl, inputTitle, inputNote, inputKeywords, inputBmGroup, bmGroupsList, inputArchive] = [ document.getElementById("bm-id"), document.getElementById("input-url"), document.getElementById("input-title"), document.getElementById("input-note"), document.getElementById("input-keywords"), document.getElementById("input-bmGroup"), document.getElementById("bmGroups-list"), document.getElementById("input-archive"), ];

window.addEventListener("load", () => {
    getCurrTab();
    checkConnection();
});

let currTab = "";
const getCurrTab = () => {
    chrome.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
        currTab = tabs[0];
        inputUrl.value = currTab.url;
        inputTitle.value = currTab.title;
    });
};

let conn = false;
const checkConnection = async () => {
    if (!conn) {
        try {
            const fetchURL = API_ENDPOINT + "add/";
            const res = await fetch(fetchURL);
            console.log(res.status, await res.text());
        } catch (e) {
            conn = false;
            document.querySelector(".centered").innerHTML = `<a href="https://github.com/dalennod/dalennod" target="_blank"> <span style="text-decoration: underline;">Dalennod</span> </a>(web-server) must be running.`;
            await chrome.action.setIcon({ path: defaultIconPaths });
            return;
        }
        conn = true;
    }
    checkUrl(currTab.url);
    await fillAllGroups();
};

let oldData = "";
const checkUrl = async (currTabUrl) => {
    const fetchUrl = API_ENDPOINT + "check-url/";
    const res = await fetch(fetchUrl, {
        method: "POST",
        body: JSON.stringify({ url: currTabUrl }),
    });
    if (res.status === 404) {
        await chrome.action.setIcon({ path: defaultIconPaths });
    } else {
        const receviedData = await res.json();

        btnUpdate.removeAttribute("hidden");
        btnRemove.removeAttribute("hidden");
        btnCreate.setAttribute("hidden", "");
        oldData = JSON.parse(JSON.stringify(receviedData));
        fillData(oldData);

        await chrome.action.setIcon({ path: existsIconPaths });
    }
    return;
};

const fillData = (dataFromDb) => {
    bmId.innerHTML = dataFromDb.id;
    inputUrl.value = dataFromDb.url;
    inputTitle.value = dataFromDb.title;
    inputNote.value = dataFromDb.note;
    inputKeywords.value = dataFromDb.keywords;
    inputBmGroup.value = dataFromDb.bmGroup;
    dataFromDb.archive ? btnArchive.setAttribute("hidden", "") : btnArchive.removeAttribute("hidden");
    dataFromDb.byteThumbURL ? moreOptions.setAttribute("hidden", "") : moreOptions.removeAttribute("hidden");
};

const fillAllGroups = async () => {
    const fetchUrl = API_ENDPOINT + "groups/";
    const res = await fetch(fetchUrl);
    const allGroups = await res.text();
    bmGroupsList.innerHTML = allGroups;
};

btnCreate.addEventListener("click", () => addEntry());
const addEntry = async () => {
    const dataJSON = {
        url: inputUrl.value,
        title: inputTitle.value,
        note: inputNote.value,
        keywords: inputKeywords.value,
        bmGroup: inputBmGroup.value,
        archive: inputArchive.checked ? true : false,
    };

    if (dataJSON.archive) {
        archiveWarn.removeAttribute("hidden");
    }

    btnCreate.disabled = true;

    const fetchURL = API_ENDPOINT + "add/";
    const res = await fetch(fetchURL, {
        method: "POST",
        body: JSON.stringify(dataJSON),
    });

    if (res.ok) {
        resizeInput();

        archiveWarn.setAttribute("hidden", "");
        btnCreate.disabled = false;
        checkmark.removeAttribute("hidden");
        overlayText.innerHTML = "Created&nbsp;&check;";
        overlayDiv.style.display = "block";
        setTimeout(() => {
            checkmark.setAttribute("hidden", "");
            overlayDiv.style.display = "none";
            window.close();
        }, 1000);

        checkUrl(dataJSON.url);
    }
};

btnUpdate.addEventListener("click", () => updateEntry(bmId.innerHTML));
const updateEntry = async (idInDb) => {
    const dataJSON = {
        url: inputUrl.value,
        title: inputTitle.value,
        note: inputNote.value,
        keywords: inputKeywords.value,
        bmGroup: inputBmGroup.value,
        archive: inputArchive.checked ? true : false,
    };

    if (dataJSON.archive) {
        archiveWarn.removeAttribute("hidden");
    } else if (!dataJSON.archive && oldData.archive) {
        dataJSON.archive = true;
        dataJSON.snapshotURL = oldData.snapshotURL;
    }

    btnUpdate.disabled = true;
    btnRemove.disabled = true;

    const fetchURL = API_ENDPOINT + "update/" + idInDb;
    const res = await fetch(fetchURL, {
        method: "POST",
        body: JSON.stringify(dataJSON),
    });

    if (res.ok) {
        checkmark.removeAttribute("hidden");
        overlayText.innerHTML = "Updated&nbsp;&check;";
        overlayDiv.style.display = "block";
        btnUpdate.disabled = false;
        btnRemove.disabled = false;
        archiveWarn.setAttribute("hidden", "");
        setTimeout(() => {
            checkmark.setAttribute("hidden", "");
            overlayDiv.style.display = "none";
            window.close();
        }, 1000);

        checkUrl(dataJSON.url);
    }
};

btnRemove.addEventListener("dblclick", () => removeEntry(bmId.innerHTML));
const removeEntry = async (idInDb) => {
    const fetchURL = API_ENDPOINT + "delete/" + idInDb;
    const res = await fetch(fetchURL);

    if (res.ok) {
        resizeInput();

        checkmark.removeAttribute("hidden");
        overlayText.innerHTML = "Removed&nbsp;&check;";
        overlayDiv.style.display = "block";
        setTimeout(() => {
            checkmark.setAttribute("hidden", "");
            overlayDiv.style.display = "none";
            window.close();
        }, 1000);

        checkUrl(currTab.url);
    }
};

btnRefetchThumbnail.addEventListener("click", () => refetchThumbnail(bmId.innerHTML));
const refetchThumbnail = async (idInDb) => {
    const fetchUrl = API_ENDPOINT + "refetch-thumbnail/" + idInDb;
    const res = await fetch(fetchUrl);
    if (res.ok) {
        overlayText.innerHTML = "Refetched thumbnail&nbsp;&check;";
        overlayDiv.style.display = "block";
        setTimeout(() => {
            overlayDiv.style.display = "none";
            moreOptions.setAttribute("hidden", "");
        }, 1000);
    } else {
        console.log("error refetching thumbnail. STATUS:", res.status);
        overlayText.innerHTML = "Failed&nbsp;&cross;";
        overlayDiv.style.display = "block";
        setTimeout(() => {
            overlayDiv.style.display = "none";
        }, 1000);
    }
};

inputArchive.addEventListener("click", () => { inputArchive.checked ? archiveLabel.innerText = "Yes" : archiveLabel.innerText = "No"; });

const resizeInput = () => {
    const input = document.querySelectorAll("input");
    for (let i = 0; i < input.length; i++) {
        input[i].type === "text" ? input[i].setAttribute("size", input[i].getAttribute("placeholder").length) : {};
        input[i].value = "";
    }
};
resizeInput();
