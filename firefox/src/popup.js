import { API_ENDPOINT } from "./module.js";
import { existsIconPaths, defaultIconPaths } from "./module.js";
import { checkUrl, currentTab, setCurrentTab } from "./module.js";

"use strict";

const [overlayDiv, overlayText, checkmark, archiveWarn, moreOptions, archiveLabel] = [document.getElementById("done-overlay-div"), document.getElementById("done-overlay-text"), document.getElementById("checkmark"), document.getElementById("archive-warn"), document.getElementById("more-options"), document.getElementById("input-archive-label")];
const [btnCreate, btnUpdate, btnRemove, btnArchive, btnRefetchThumbnail] = [document.getElementById("button-add-req"), document.getElementById("button-update-req"), document.getElementById("button-remove-req"), document.getElementById("radio-btn-archive"), document.getElementById("button-refetch-thumbnail")];
const [bmId, inputUrl, inputTitle, inputNote, inputKeywords, inputBmGroup, bmGroupsList, inputArchive] = [document.getElementById("bm-id"), document.getElementById("input-url"), document.getElementById("input-title"), document.getElementById("input-note"), document.getElementById("input-keywords"), document.getElementById("input-bmGroup"), document.getElementById("bmGroups-list"), document.getElementById("input-archive")];

window.addEventListener("load", () => {
    resizeInput();
    getCurrTab();
});

const getCurrTab = () => {
    browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
        setCurrentTab(tabs[0]);
        inputUrl.value = currentTab.url;
        inputTitle.value = currentTab.title;
        checkUrlReq(currentTab.url);
    });
};

let oldData = "";
const checkUrlReq = async (url) => {
    try {
        const response = await checkUrl(url);
        if (response.status === 404) {
            await browser.browserAction.setIcon({ path: defaultIconPaths });
        } else {
            await browser.browserAction.setIcon({ path: existsIconPaths });
            btnUpdate.removeAttribute("hidden");
            btnRemove.removeAttribute("hidden");
            btnCreate.setAttribute("hidden", "");
            oldData = JSON.parse(JSON.stringify(await response.json()));
            fillData(oldData);
        }
    } catch (err) {
        document.querySelector(".centered").innerHTML = "<p class=\"center-text\"><a href=\"https://github.com/dalennod/dalennod\" target=\"_blank\"> <span style=\"text-decoration: underline;\">Dalennod</span> </a>(web-server) must be running.</p>";
        await browser.browserAction.setIcon({ path: defaultIconPaths });
        return;
    }
    await fillAllGroups();
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
    bmGroupsList.innerHTML = await res.text();
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

        checkUrlReq(dataJSON.url);
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

        checkUrlReq(dataJSON.url);
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

        checkUrlReq(currentTab.url);
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
    checkUrlReq(currentTab.url);
};

inputArchive.addEventListener("click", () => { inputArchive.checked ? archiveLabel.innerText = "Yes" : archiveLabel.innerText = "No"; });

let currentSuggestion;
inputKeywords.addEventListener("input", (event) => {
    if (event.inputType === "deleteContentBackward" || event.inputType === "deleteContentForward")
        return;
    const inputText = inputKeywords.value;
    const lastWord = inputText.split(/[\s,]+/).pop();
    lastWord ? currentSuggestion = getSuggestion(lastWord) : null;
    if (currentSuggestion) {
        const cursorPosition = inputKeywords.selectionStart;
        const newText = inputText.slice(0, inputText.length - lastWord.length) + currentSuggestion;
        inputKeywords.value = newText;
        inputKeywords.setSelectionRange(cursorPosition, cursorPosition + currentSuggestion.length);
    }
});

inputKeywords.addEventListener("keydown", (event) => {
    if (event.key === "Tab" && currentSuggestion) {
        event.preventDefault();
        const inputText = inputKeywords.value;
        const lastWord = inputText.split(/[\s,]+/).pop();
        const newText = inputText.slice(0, inputText.length - lastWord.length) + currentSuggestion;
        inputKeywords.value = newText;
        inputKeywords.setSelectionRange(newText.length, newText.length);
        currentSuggestion = undefined;
    }
});

let autocompleteWords = [];
const getSuggestion = (lastWord) => {
    return autocompleteWords.find(word => word.startsWith(lastWord));
}

inputKeywords.addEventListener("focus", () => { gatherWords();  });
const gatherWords = () => {
    const minLength = 2;
    const delim = " ";
    autocompleteWords = [];

    if (inputTitle.value.length > minLength) {
        const titleWords = [...new Set(inputTitle.value.split(delim))].filter(item => item.length > minLength);
        autocompleteWords.push(...titleWords);
    }
    if (inputNote.value.length > minLength) {
        const noteWords = [...new Set(inputNote.value.split(delim))].filter(item => item.length > minLength);
        autocompleteWords.push(...noteWords);
    }
};

const resizeInput = () => {
    const input = document.querySelectorAll("input");
    for (let i = 0; i < input.length; i++) {
        input[i].type === "text" ? input[i].setAttribute("size", input[i].getAttribute("placeholder").length) : {};
        input[i].value = "";
    }
};
