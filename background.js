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

/*
try {
    importScripts('common.js');
} catch (e) {
    console.log(e);
}
*/

var History = {};
let isActive = false;
let lastDate = new Date();
let interval = 5000;
let frequency = 1000;
let urlIndex = 0;
let urls

chrome.action.setBadgeText({ 'text': '...'});
// chrome.action.setBadgeBackgroundColor({ 'color': "#777" });

/*
function Update(t, tabId, url) {
    if (!url) {
        return;
    }
    if (tabId in History) {
        if (url == History[tabId][0][1]) {
            return;
        }
    } else {
        History[tabId] = [];
    }
    History[tabId].unshift([t, url]);

    var history_limit = 23; //parseInt(localStorage["history_size"]);
    if (! history_limit) {
        history_limit = 23;
    }
    while (History[tabId].length > history_limit) {
        History[tabId].pop();
    }

    chrome.action.setBadgeText({ 'tabId': tabId, 'text': '0:00'});
    chrome.action.setPopup({ 'tabId': tabId, 'popup': "popup.html#tabId=" + tabId});
}

function HandleUpdate(tabId, changeInfo, tab) {
    let now = new Date();
    Update(now, tabId, changeInfo.url);
    console.log("updated");
    // isActive = true;
}

function HandleRemove(tabId, removeInfo) {
    delete History[tabId];
    console.log("removed");
    // isActive = false;
}

function HandleReplace(addedTabId, removedTabId) {
    var t = new Date();
    delete History[removedTabId];
    chrome.tabs.get(addedTabId, function(tab) {
        Update(t, addedTabId, tab.url);
    });
}
*/

function LoopWebsite() {
    var now = new Date();
    /*
    for (tabId in History) {
        var description = FormatDuration(now - History[tabId][0][0]);
        chrome.action.setBadgeText({ 'tabId': parseInt(tabId), 'text': description});
    }
    */

    if (isActive && urls.length > 0) {
        const ms = now.getTime() - lastDate.getTime()
        // console.log("now: " + now);
        // console.log("interval: " + ms);
        if (ms >= interval) {
            lastDate = now;
            let url = urls[urlIndex];
            urlIndex += 1;
            if (urlIndex >= urls.length) {
                urlIndex = 0;
            }
            chrome.tabs.update(undefined, { url: url });
            console.log("reload: " + url);
        }

        //let url = "http://1.1.1.1/" + tabId
        //chrome.tabs.update(undefined, { url: url });

        const passedTimeInSecond = Math.round(ms / 1000)
        const intervalInSecond = Math.round(interval / 1000)
        chrome.action.setBadgeText({ 'text': passedTimeInSecond + '/' + intervalInSecond});
    } else {
        chrome.action.setBadgeText({ 'text': 'off'});
    }
}

function reload() {
    chrome.storage.sync.get(["reloadInterval"]).then((result) => {
        console.log("background loaded interval: " + result.reloadInterval)
        if (result.reloadInterval != null) {
            interval = result.reloadInterval * 1000
            chrome.storage.sync.get(["timerFrequency"]).then((result) => {
                console.log("background loaded frequency: " + result.timerFrequency)
                if (result.timerFrequency != null) {
                    frequency = result.timerFrequency * 1000
                    console.log("background starting...")
                    setInterval(LoopWebsite, frequency);
                }
            });
        }
    });
}

reload()

/*
chrome.tabs.onUpdated.addListener(HandleUpdate);
chrome.tabs.onRemoved.addListener(HandleRemove);
chrome.tabs.onReplaced.addListener(HandleReplace);

chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) { 
        if (request.action == "openNewTab")
            chrome.tabs.create({ url: request.url });
    }
);
*/

chrome.runtime.onMessage.addListener((request, sender, reply) => {
    console.log(
        sender.tab
        ? "from a content script:" + sender.tab.url
        : "from the extension"
    );
    if (request.command == "query-is-looping") {
        if (request.shouldToggle && request.urlArray != null) {
            isActive = !isActive;
            console.log("background toggle: " + isActive)
            urls = request.urlArray
            console.log(urls)
        }
        reply({ isLooping: isActive })
        reload()
    }

    return true
});
