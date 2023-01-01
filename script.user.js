// ==UserScript==
// @name         Informed Delivery AdBlock
// @author       luke
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Block ads in USPS Informed Delivery (https://dirmailserv.com/2020/03/25/create-usps-informed-delivery-ads/)
// @author       You
// @match        https://informeddelivery.usps.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=usps.com
// @grant        none
// ==/UserScript==

const currently_selected_day_el = '#cp_week > .active > a';

// Wait until we see a day actively selected
// This can mean that the ads do briefly appear, but it ensures reliability when removing them
waitForKeyElements(currently_selected_day_el, () => {

  let adLetters = document.querySelectorAll('.yesRideAlong');
  const numberOfAds = adLetters.length;

  // change active text to remove ads
  let activeText = document.querySelector(currently_selected_day_el).innerText;
  const activeTextMatch = activeText.match(/(\w+)\((\d+)\)/);
  const dayOfWeek = activeTextMatch[1];
  const numberOfLetters = parseInt(activeTextMatch[2]);
  const trueNumberOfLetters = numberOfLetters - numberOfAds;

  document.querySelector(currently_selected_day_el).innerText = dayOfWeek + '(' + String(trueNumberOfLetters) + ')'

  // add indicator saying we removed some ads
  if (numberOfAds > 0) {

    // Use interactive <a> to show/hide ads
    let onclickFunc = `
        let text = document.getElementById('adsWereRemovedMsg').innerText;
        if (text === '(Show)') {
          document.querySelectorAll('.hiddenAdLetter').forEach(e => { e.style='display: block;' });
          document.getElementById('adsWereRemovedMsg').innerText = '(Hide)'
        } else if (text === '(Hide)') {
          document.querySelectorAll('.hiddenAdLetter').forEach(e => { e.style='display: none;' });
          document.getElementById('adsWereRemovedMsg').innerText = '(Show)'
        }
    `

    let adsRemovedMsgEl = document.createElement('div');
    let removedAdMsg = `${numberOfAds} ${numberOfAds > 1 ? 'advertisements were' : 'advertisement was'} removed.
        <a id="adsWereRemovedMsg" style="cursor: pointer;" onclick="${onclickFunc}">(Show)</a>`
    adsRemovedMsgEl.classList.add('noMail'); // use their CSS
    adsRemovedMsgEl.innerHTML = removedAdMsg;

    // insert on page
    let basePage = document.querySelector('#CurrentMailpieces');
    basePage.insertBefore(adsRemovedMsgEl, basePage.firstChild);
  }


  // remove ads
  for (let letter of adLetters) {
    let adLetterTopEl = letter.parentElement.parentElement.parentElement;
    adLetterTopEl.style = "display: none;"
    adLetterTopEl.classList.add('hiddenAdLetter');
  }
}, true);


// Depdendencies

/*--- waitForKeyElements():  A utility function, for Greasemonkey scripts,
    that detects and handles AJAXed content. Forked for use without JQuery.
    Usage example:
        waitForKeyElements (
            "div.comments"
            , commentCallbackFunction
        );
        //--- Page-specific function to do what we want when the node is found.
        function commentCallbackFunction (element) {
            element.text ("This comment changed by waitForKeyElements().");
        }

    IMPORTANT: Without JQuery, this fork does not look into the content of
    iframes.
*/
function waitForKeyElements(
  selectorTxt,    /* Required: The selector string that
                        specifies the desired element(s).
                    */
  actionFunction, /* Required: The code to run when elements are
                        found. It is passed a jNode to the matched
                        element.
                    */
  bWaitOnce      /* Optional: If false, will continue to scan for
                        new elements even after the first match is
                        found.
                    */
) {
  var targetNodes, btargetsFound;
  targetNodes = document.querySelectorAll(selectorTxt);

  if (targetNodes && targetNodes.length > 0) {
    btargetsFound = true;
    /*--- Found target node(s).  Go through each and act if they
        are new.
    */
    targetNodes.forEach(function (element) {
      var alreadyFound = element.dataset.found == 'alreadyFound' ? 'alreadyFound' : false;

      if (!alreadyFound) {
        //--- Call the payload function.
        var cancelFound = actionFunction(element);
        if (cancelFound)
          btargetsFound = false;
        else
          element.dataset.found = 'alreadyFound';
      }
    });
  }
  else {
    btargetsFound = false;
  }

  //--- Get the timer-control variable for this selector.
  var controlObj = waitForKeyElements.controlObj || {};
  var controlKey = selectorTxt.replace(/[^\w]/g, "_");
  var timeControl = controlObj[controlKey];

  //--- Now set or clear the timer as appropriate.
  if (btargetsFound && bWaitOnce && timeControl) {
    //--- The only condition where we need to clear the timer.
    clearInterval(timeControl);
    delete controlObj[controlKey];
  }
  else {
    //--- Set a timer, if needed.
    if (!timeControl) {
      timeControl = setInterval(function () {
        waitForKeyElements(selectorTxt,
          actionFunction,
          bWaitOnce
        );
      },
        300
      );
      controlObj[controlKey] = timeControl;
    }
  }
  waitForKeyElements.controlObj = controlObj;
}