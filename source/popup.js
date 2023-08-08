/*
 * Copyright 2013 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/// UI elements.

let buttonToggle
let buttonSave
let textURLs
// let paragraphURLs
let tableURLs

/// TODO: rename to reloadInterval. How frequent the current window/tab should be reloaded.
let inputInterval

/// How frequent the background timer runs.
let inputFrequency

/// An array of URL strings to be sent to `background`.
let urlArray = []

/// TODO: rename to `updateButtonStatus` or whatever.
/// `shouldToggle`: toggle loop status
function updateUI(shouldToggle) {
    /// TODO: rename `command` to `update-loop` or something like this.
    chrome.runtime.sendMessage({ command: "query-is-looping", shouldToggle: shouldToggle, urlArray: urlArray }, function (response) {
        console.log(response.isLooping);
        if (buttonToggle != null) {
            buttonToggle.textContent = response.isLooping ? 'Looping: click to stop' : 'Not looping: click to start';
        } else {
            console.log('popup: toggle button is null');
        }
    });
}

/// Toggle background looping and update UI.
function toggle() {
    console.log("popup: toggle");
    updateUI(true);
}

/// TODO: rename to `updateTableAndSave`.
function save() {
    if (textURLs == null || tableURLs == null) {
        console.log('popup save: unexpected null UI elements')
        return
    }
    console.log('popup: save')
    const urlString = textURLs.value
    console.log("popup text: " + urlString)
    const urls = urlString.split(/\n/)
    console.log("popup URLs: " + urls)
    // paragraphURLs.textContent = textURLs.textContent

    tableURLs.innerHTML = ""

    const rowNode = document.createElement("tr")
    const cellNotes = document.createElement("td")
    const cellURL = document.createElement("td")
    const textNotes = document.createTextNode('Notes')
    const textURL = document.createTextNode('Websites')

    cellNotes.appendChild(textNotes)
    cellURL.appendChild(textURL)
    rowNode.appendChild(cellNotes)
    rowNode.appendChild(cellURL)
    tableURLs.appendChild(rowNode)

    let notes = ""
    let url = null
    urlArray = []

    urls.forEach((line) => {
        console.log(line)

        // TODO: replace with proper URL validation
        if (line.startsWith('http')) {
            url = line
        } else {
            notes += line + " "
        }

        if (url != null) {
            const rowNode = document.createElement("tr")
            const cellNotes = document.createElement("td")
            const cellURL = document.createElement("td")
            const textNotes = document.createTextNode(notes)
            const textURL = document.createTextNode(url)

            cellNotes.appendChild(textNotes)
            cellURL.appendChild(textURL)
            rowNode.appendChild(cellNotes)
            rowNode.appendChild(cellURL)
            tableURLs.appendChild(rowNode)

            urlArray.push(url)
            notes = ""
            url = null
        }
    });

    chrome.storage.sync.set({ urlList: urlString }).then(() => {
        console.log("popup saved url: " + urlString);
    });
    chrome.storage.sync.set({ reloadInterval: inputInterval.value }).then(() => {
        console.log("popup saved interval: " + inputInterval.value);
    });
    chrome.storage.sync.set({ timerFrequency: inputFrequency.value }).then(() => {
        console.log("popup saved: frequency: " + inputFrequency.value);
    });
}

document.addEventListener("DOMContentLoaded", function() {
    buttonToggle = document.getElementById("buttonToggle")
    buttonSave = document.getElementById("buttonSave")
    textURLs = document.getElementById("textAreaURLs")
    // paragraphURLs = document.getElementById("paragraphURLs")
    tableURLs = document.getElementById("tableURLs")
    inputInterval = document.getElementById("inputInterval")
    inputFrequency = document.getElementById("inputFrequency")

    buttonToggle.addEventListener("click", toggle)
    buttonSave.addEventListener("click", save)

    // Load interval
    chrome.storage.sync.get(["reloadInterval"]).then((result) => {
        console.log("popup loaded: " + result.reloadInterval)
        if (inputInterval != null && result.reloadInterval != null) {
            inputInterval.value = result.reloadInterval

            // Load frequency
            chrome.storage.sync.get(["timerFrequency"]).then((result) => {
                console.log("popup loaded: " + result.timerFrequency)
                if (inputFrequency != null && result.timerFrequency != null) {
                    inputFrequency.value = result.timerFrequency

                    // Load URL list
                    chrome.storage.sync.get(["urlList"]).then((result) => {
                        console.log("popup loaded: " + result.urlList)
                        if (textURLs != null) {
                            textURLs.value = result.urlList
                            save()
                        }
                    });
                }
            });
        } else {
            console.log("popup failure: cannot load reloadInterval")
        }
    });

    updateUI(false)
});

console.log("popup loaded")
