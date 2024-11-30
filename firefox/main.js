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

const [overlayDiv, overlayText, checkmark, archiveWarn, moreOptions] = [
    document.querySelector("#done-overlay-div"),
    document.querySelector("#done-overlay-text"),
    document.querySelector("#checkmark"),
    document.querySelector("#archive-warn"),
    document.getElementById("more-options"),
];
const [btnCreate, btnUpdate, btnRemove, btnArchive, btnRefetchThumbnail] = [
    document.getElementById("button-add-req"),
    document.getElementById("button-update-req"),
    document.getElementById("button-remove-req"),
    document.getElementById("radio-btn-archive"),
    document.getElementById("button-refetch-thumbnail"),
];
const [
    bmId,
    inputUrl,
    inputTitle,
    inputNote,
    inputKeywords,
    inputBmGroup,
    bmGroupsList,
    archiveRadioNo,
] = [
    document.querySelector("#bm-id"),
    document.querySelector("#input-url"),
    document.querySelector("#input-title"),
    document.querySelector("#input-note"),
    document.querySelector("#input-keywords"),
    document.querySelector("#input-bmGroup"),
    document.querySelector("#bmGroups-list"),
    document.querySelector("#radio-no"),
];

window.addEventListener("load", () => {
    getCurrTab();
    checkConnection();
});

let currTab = "";
const getCurrTab = () => {
    browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
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
            document.querySelector(".centered").innerHTML =
                `<a href="https://github.com/dalennod/dalennod" target="_blank"> <span style="text-decoration: underline;">Dalennod</span> </a>(web-server) must be running.`;
            return;
        }
        conn = true;
    }
    checkUrl(currTab.url);
    await fillAllGroups();
};

const checkUrl = async (currTabUrl) => {
    const fetchUrl = API_ENDPOINT + "check-url/";
    const res = await fetch(fetchUrl, {
        method: "POST",
        body: JSON.stringify({ url: currTabUrl }),
    });
    if (res.status === 404) {
        await browser.browserAction.setIcon({ path: defaultIconPaths });
    } else {
        const receviedData = await res.json();

        btnUpdate.removeAttribute("hidden");
        btnRemove.removeAttribute("hidden");
        btnCreate.setAttribute("hidden", "");
        fillData(JSON.parse(JSON.stringify(receviedData)));

        await browser.browserAction.setIcon({ path: existsIconPaths });
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
    dataFromDb.archive
        ? btnArchive.setAttribute("hidden", "")
        : btnArchive.removeAttribute("hidden");
    dataFromDb.byteThumbURL
        ? moreOptions.setAttribute("hidden", "")
        : moreOptions.removeAttribute("hidden");
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
        archive: archiveRadioNo.checked ? false : true,
    };

    if (dataJSON.archive) {
        archiveWarn.removeAttribute("hidden");
        btnCreate.disabled = true;
    }

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
        archive: archiveRadioNo.checked ? false : true,
    };

    const fetchURL = API_ENDPOINT + "update/" + idInDb;
    const res = await fetch(fetchURL, {
        method: "POST",
        body: JSON.stringify(dataJSON),
    });

    if (res.ok) {
        checkmark.removeAttribute("hidden");
        overlayText.innerHTML = "Updated&nbsp;&check;";
        overlayDiv.style.display = "block";
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

btnRefetchThumbnail.addEventListener("click", () =>
    refetchThumbnail(bmId.innerHTML),
);
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

const resizeInput = () => {
    const input = document.querySelectorAll("input");
    for (let i = 0; i < input.length; i++) {
        input[i].type === "text"
            ? input[i].setAttribute(
                  "size",
                  input[i].getAttribute("placeholder").length,
              )
            : {};
        input[i].value = "";
    }
};
resizeInput();
