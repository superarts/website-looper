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

var tabId_re = /tabId=([0-9]+)/;
var match = tabId_re.exec(window.location.hash);
if (match) {
    /*
    var hist = chrome.extension.getBackgroundPage().History[match[1]];
    var table = document.createElement("table");
    for (var i=0; i < hist.length; i++) {
        var r = table.insertRow(-1);

        var date = "";
        if (i == hist.length - 1 ||
            (hist[i][0].toLocaleDateString() != hist[i+1][0].toLocaleDateString())) {
            date = hist[i][0].toLocaleDateString();
        }
        r.insertCell(-1).textContent = date;

        r.insertCell(-1).textContent = hist[i][0].toLocaleTimeString();

        var end_time;
        if (i == 0) {
            end_time = new Date();
        } else {
            end_time = hist[i-1][0];
        }
        r.insertCell(-1).textContent = FormatDuration(end_time - hist[i][0]);

        var a = document.createElement("a");
        a.textContent = hist[i][1];
        a.setAttribute("href", hist[i][1]);
        a.setAttribute("target", "_blank");
        r.insertCell(-1).appendChild(a);
    }
    document.body.appendChild(table);
    */
}

let buttonToggle
let buttonSave
let textURLs
// let paragraphURLs
let tableURLs
let inputInterval
let inputFrequency

/// `shouldToggle`: toggle loop status
function updateUI(shouldToggle) {
    chrome.runtime.sendMessage({ command: "query-is-looping", shouldToggle: shouldToggle, urlArray: urlArray }, function (response) {
        console.log(response.isLooping);
        if (buttonToggle != null) {
            buttonToggle.textContent = response.isLooping ? 'Looping: click to stop' : 'Not looping: click to start';
        } else {
            console.log('popup: toggle button is null');
        }
    });
}

function toggle() {
    // chrome.extension.getBackgroundPage().console.log('xxxxxx');
    console.log("popup: toggle");
    /*
    chrome.extension.sendMessage({
        action: "openNewTab",
        url: "www.google.com"
    });
    */
    updateUI(true);
}

let urlArray = []

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
    // tableURLs.textContent = textURLs.textContent

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

        /*
        const rowNode = document.createElement("tr")
        const cellNode = document.createElement("td")
        const textNode = document.createTextNode(url)

        cellNode.appendChild(textNode)
        rowNode.appendChild(cellNode)
        tableURLs.appendChild(rowNode)
        */
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

// document.getElementById('toggle').onclick = toggle;

/*
document.addEventListener('DOMContentLoaded', function() {
    var link = document.getElementById('toggle');
    // onClick's logic below:
    link.addEventListener('click', function() {
        toggle();
    });
});
*/

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
        }
    });

    updateUI(false)
});

console.log("popup loaded");
