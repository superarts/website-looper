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

/// TODO: move some reusable codes to some common js files / libs.
/*
try {
    importScripts('common.js');
} catch (e) {
    console.log(e);
}
*/

var History = {}
let isActive = false
let lastDate = new Date()
let interval = 5000
let frequency = 1000
let urlIndex = 0
let urls = []

chrome.action.setBadgeText({ 'text': '...'});
// chrome.action.setBadgeBackgroundColor({ 'color': "#777" });

function LoopWebsite() {
    var now = new Date();

    if (isActive && urls.length > 0) {
        const ms = now.getTime() - lastDate.getTime()
        // console.log("now: " + now);
        // console.log("interval: " + ms);
        if (ms >= interval) {
            lastDate = now
            let url = urls[urlIndex]
            urlIndex += 1
            if (urlIndex >= urls.length) {
                urlIndex = 0
            }
            chrome.tabs.update(undefined, { url: url })
            console.log("reload: " + url)
        }

        const passedTimeInSecond = Math.round(ms / 1000)
        const intervalInSecond = Math.round(interval / 1000)
        chrome.action.setBadgeText({ 'text': passedTimeInSecond + '/' + intervalInSecond})
    } else {
        chrome.action.setBadgeText({ 'text': 'off'})
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

                    // Load URL list
                    chrome.storage.sync.get(["urls"]).then((result) => {
                        console.log("options loaded: " + result.urls)
                        if (result.urls != null) {
                            urls = result.urls
                            setInterval(LoopWebsite, frequency)
                        }
                    });
                }
            });
        }
    });
}

chrome.runtime.onMessage.addListener((request, sender, reply) => {
    console.log(
        sender.tab
        ? "background listener - message from a content script:" + sender.tab.url
        : "background listener - message from the extension"
    );

    if (request.command == "query-is-looping") {
        if (request.shouldToggle && request.urlArray != null) {
            isActive = !isActive
            console.log("background toggle: " + isActive)
            urls = request.urlArray
            console.log(urls)
        }
        reply({ isLooping: isActive })
        reload()
    }

    return true
});

chrome.action.onClicked.addListener((tab) => {
    console.log('background click state: ' + tab.id)
    isActive = !isActive
})

reload()
