import { existsIconPaths, defaultIconPaths } from "./module.js";
import { getAPIEndpoint, checkUrl, currentTab, setCurrentTab } from "./module.js";

"use strict";

const [overlayDiv, overlayText, checkmark, archiveWarn, archiveLabel] = [document.getElementById("done-overlay-div"), document.getElementById("done-overlay-text"), document.getElementById("checkmark"), document.getElementById("archive-warn"), document.getElementById("input-archive-label")];
const [btnCreate, btnUpdate, btnRemove, btnArchive] = [document.getElementById("button-add-req"), document.getElementById("button-update-req"), document.getElementById("button-remove-req"), document.getElementById("radio-btn-archive")];
const [bkmID, inputUrl, inputTitle, inputNote, inputKeywords, inputCategory, categoriesList, inputArchive] = [document.getElementById("bkm-id"), document.getElementById("input-url"), document.getElementById("input-title"), document.getElementById("input-note"), document.getElementById("input-keywords"), document.getElementById("input-category"), document.getElementById("categories-list"), document.getElementById("input-archive")];

let API_ENDPOINT;
window.addEventListener("load", async () => {
    API_ENDPOINT = await getAPIEndpoint();
    resizeInput();
    getCurrTab();
    setUILink();
    adjustTextarea(inputNote);
});

let bkmSaveState = false;
const POPUP_STATE_KEY = "popup_state";
window.addEventListener("visibilitychange", () => {
    if (bkmSaveState) {
        localStorage.removeItem(POPUP_STATE_KEY);
        return;
    }
    if (document.visibilityState === "hidden") {
        const inputs = document.querySelectorAll("input, textarea");
        const state = {
            inputs: Array.from(inputs).reduce((obj, el) => {
                obj[el.id] = el.value;
                return obj;
            }, {}),
            bkmSaveState: bkmSaveState
        };
        localStorage.setItem(POPUP_STATE_KEY, JSON.stringify(state));
    }
});

const setUILink = () => {
    const a = document.querySelectorAll("nav a");
    a.forEach((item) => item.href = API_ENDPOINT.slice(0, -5));
};

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
            fillDataFromSavedState();
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
    await fillAllCategories();
};

const fillDataFromSavedState = () => {
    const savedState = localStorage.getItem(POPUP_STATE_KEY);
    if (savedState) {
        const state = JSON.parse(savedState);
        if (state.bkmSaveState || state.inputs["input-url"] !== inputUrl.value) {
            return false;
        }

        for (let [id, value] of Object.entries(state.inputs)) {
            const el = document.getElementById(id);
            if (el) el.value = value;
        }
        inputNote.style.height = "auto";
        inputNote.style.height = inputNote.scrollHeight + "px";
        return true;
    }
    return false;
}

const fillData = (dataFromDB) => {
    bkmID.innerText = dataFromDB.id;
    if (!fillDataFromSavedState()) {
        bkmID.innerText = dataFromDB.id;
        inputUrl.value = dataFromDB.url;
        inputTitle.value = dataFromDB.title;
        if (dataFromDB.note) inputNote.value = dataFromDB.note; inputNote.style.height = "auto"; inputNote.style.height = inputNote.scrollHeight + "px";
        inputNote.value = dataFromDB.note;
        inputKeywords.value = dataFromDB.keywords;
        inputCategory.value = dataFromDB.category;
        dataFromDB.archive ? btnArchive.setAttribute("hidden", "") : btnArchive.removeAttribute("hidden");
    }
    return;
};

const fillAllCategories = async () => {
    const fetchUrl = API_ENDPOINT + "categories/";
    const res = await fetch(fetchUrl);
    // categoriesList.innerHTML = await res.text();

    // Have to do this to pass web-ext.js check
    const categories = await res.text();
    const categories_split = categories.split("\"");

    for (let i = 0; i < categories_split.length; ++i) {
        if (i % 2 === 1) {
            const option_element = document.createElement("option");
            option_element.value = categories_split[i];
            categoriesList.appendChild(option_element);
        }
    }
};

btnCreate.addEventListener("click", () => addEntry());
const addEntry = async () => {
    const dataJSON = {
        url: inputUrl.value,
        title: inputTitle.value,
        note: inputNote.value,
        keywords: inputKeywords.value,
        category: inputCategory.value,
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
            bkmSaveState = true;
            window.close();
        }, 1000);

        localStorage.removeItem(POPUP_STATE_KEY);

        checkUrlReq(dataJSON.url);
    }
};

btnUpdate.addEventListener("click", () => updateEntry(bkmID.innerHTML));
const updateEntry = async (idInDb) => {
    const dataJSON = {
        url: inputUrl.value,
        title: inputTitle.value,
        note: inputNote.value,
        keywords: inputKeywords.value,
        category: inputCategory.value,
        archive: inputArchive.checked ? true : false,
    };

    console.log(dataJSON);
    console.log(idInDb);

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
            bkmSaveState = true;
            window.close();
        }, 1000);

        localStorage.removeItem(POPUP_STATE_KEY);

        checkUrlReq(dataJSON.url);
    }
};

btnRemove.addEventListener("dblclick", () => removeEntry(bkmID.innerHTML));
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
            bkmSaveState = true;
            window.close();
        }, 1000);

        localStorage.removeItem(POPUP_STATE_KEY);

        checkUrlReq(currentTab.url);
    }
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

    if (inputTitle.value.length >= minLength) {
        const titleWords = [...new Set(inputTitle.value.split(delim))].filter(item => item.length >= minLength);
        autocompleteWords.push(...titleWords);
    }
    if (inputNote.value.length >= minLength) {
        const noteWords = [...new Set(inputNote.value.split(delim))].filter(item => item.length >= minLength);
        autocompleteWords.push(...noteWords);
    }
};

const resizeInput = () => {
    const input = document.querySelectorAll("input");
    // const inputPlaceholder = document.querySelectorAll(".input-placeholder");

    // Longest placeholder's string length + random number that looks good
    let biggestValue = 35;
    // for (let i = 0; i < inputPlaceholder.length; i++) {
    //     if (inputPlaceholder[i].innerText.length > biggestValue) {
    //         biggestValue = inputPlaceholder[i].innerText.length;
    //     }
    // }
    for (let i = 0; i < input.length; i++) {
        input[i].setAttribute("size", biggestValue);
        input[i].value = "";
    }
};

const adjustTextarea = (tar) => {
    // 8 = right/left padding of textarea
    const paddingRL = 8;
    tar.value.includes("\n")
        ? tar.style.height = (tar.scrollHeight + paddingRL) + "px"
        : tar.style.height = tar.scrollHeight + "px";
    tar.addEventListener("input", () => {
        tar.style.height = "auto";
        tar.value.includes("\n")
            ? tar.style.height = (tar.scrollHeight + paddingRL) + "px"
            : tar.style.height = tar.scrollHeight + "px";
    });
};
