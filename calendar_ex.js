/* Filename: calendar_ex.js
Author: Eni Mustafaraj
Date: 03/02/2015
Purpose: Show how to connect to Google Calendar API and perform an
operation of event creation.
*/

/* PART 1: This part is more or less lifted as is from Google APIs documentation
and examples. I have made slight changes to the handleAuthResult function,
in order to toggle on/off the visibility of two buttons of the user interface.
*/

// Global variables, the values come from the Developer Console
// Put your OWN clientID and apiKey

var clientId = '245081219628-a7urtp41iof28b6kqskr5j3a3dhu1c12.apps.googleusercontent.com';
var apiKey = 'AIzaSyBwrfTm8j1glmNnjQMk6LrSR02R5STl06I';
var scopes = 'https://www.googleapis.com/auth/calendar';
var inpagelog = document.getElementById('inpagelog');      
      
/* Function invoked when the client javascript library is loaded */
function handleClientLoad() {
  // console.log("Inside handleClientLoad ...");
  inpagelog.innerHTML += "Inside handleClientLoad ...<br/>";
  gapi.client.setApiKey(apiKey);
  window.setTimeout(checkAuth,100);
}

/* API function to check whether the app is authorized. */
function checkAuth() {
//  console.log("Inside checkAuth ...");
  inpagelog.innerHTML += "Inside checkAuth ...<br/>";
  gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, 
                      handleAuthResult);
}

/* Invoked by different functions to handle the result of authentication checks.*/
var authData;
function handleAuthResult(authResult) {
    // console.log(`Inside handleAuthResult ...`);
    // console.log(`Inside handleAuthResult ...: ${JSON.stringify(authResult)}`);
    inpagelog.innerHTML += 'Inside handleAuthResult ...<br/>';
    authData = authResult;
    var authorizeButton = document.getElementById('authorize-button');
    var addButton = document.getElementById('addToCalendar');
    if (authResult && !authResult.error) {
          authorizeButton.style.visibility = 'hidden';
          addButton.style.visibility = 'visible'; 
          //load the calendar client library
          gapi.client.load('calendar', 'v3', function(){ 
            // console.log("Calendar library loaded.");
            inpagelog.innerHTML += "Calendar library loaded.<br/>";
          });
    } else {
          authorizeButton.style.visibility = '';
          authorizeButton.onclick = handleAuthClick;
          inpagelog.innerHTML += authResult.error;
        }
}


/* Event handler that deals with clicking on the Authorize button.*/
function handleAuthClick(event) {
    gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, 
                        handleAuthResult);
    return false;
}

/* End of PART 1 - Authentication Process. */

/* Start of PART 2 - dealing with events from the user interface and 
performing API calls. */


var addButton = document.getElementById('addToCalendar');
var addStatus = document.getElementById('addStatus');
var timeWindow = {};

function enableAddButton() {
      addButton.innerText = "Add to Google Calendar";
      addButton.disabled = false;
}
addButton.onclick = function(){
  addButton.disabled = true;
  addButton.innerHTML = "wait please";
  addStatus.innerHTML = "";
  var userChoices = getUserInput();
  console.log(userChoices);
  /* inpagelog.innerHTML += JSON.stringify(userChoices);
  inpagelog.innerHTML += "<br/>"; */
  if (userChoices) {
    createEvent(userChoices);
  }
  else {
    enableAddButton();
  }
}

function setDate() {
  let now = new Date();
  // toISOString is in UTC, but we want to use local time
  // document.querySelector("#date").value = now.toISOString().slice(0,10);
  let lpad20s = (x) => {return String(x).padStart(2, "0")};
  document.querySelector("#date").value =
    [lpad20s(now.getFullYear()),
    lpad20s(now.getMonth() + 1),
    lpad20s(now.getDate())].join('-');
}

function setTime(tRef) {
  let now = new Date();
  let curTime = now.toTimeString().slice(0,8);
  timeWindow[tRef] = now;
  document.querySelector(tRef).value = curTime;
  document.querySelector(tRef+"label").innerHTML = curTime;
  // console.log(curTime);
}

function setLabel(tRef) {
  // make assumptions to set the timeWindow
  timeWindow[tRef] = new Date();
  let timeFields = document.querySelector(tRef).value.split(':');
  timeWindow[tRef].setHours(timeFields[0]);
  timeWindow[tRef].setMinutes(timeFields[1]);
  // only assign seconds if seconds are available
  // eg not IOS
  if (timeFields.length > 2) {
    timeWindow[tRef].setSeconds(timeFields[2]);
  }

  document.querySelector(tRef+"label").innerHTML = document.querySelector(tRef).value;
  // console.log(curTime);
}

function resetInputandLabel(hE) {
  resetInput(hE);
  setLabel(hE);
}

function resetInput(hE) {
  document.querySelector(hE).value = '';
}

function getUserInput(){
  
  var date = document.querySelector("#date").value;
  var startTime = document.querySelector("#start").value;
  var endTime = document.querySelector("#end").value;
  var dd = new Date((timeWindow['#end'] - timeWindow['#start']));
  var eventDesc = document.querySelector("#habit").value + `: ${dd.getMinutes()}m${dd.getSeconds()}s`;
  
  // check input values, they should not be empty
  if (date=="" || startTime=="" || endTime=="" || eventDesc==""){
    alert("All your input fields should have a meaningful value.");
    return
  }
  else return {'date': date, 'startTime': startTime, 'endTime': endTime,
               'eventTitle': eventDesc}
}

// Make an API call to create an event.  Give feedback to user.
function createEvent(eventData) {
  inpagelog.innerHTML += `START createEvent: ${eventData.eventTitle}, ${eventData.date.replace(/-/g, '/')}, ${eventData.startTime}, ${eventData.endTime}<br/>`;
  addStatus.innerHTML += `adding ${eventData.eventTitle}@${eventData.startTime}<br/>`;
//  inpagelog.innerHTML += `DEBUG GENDATE01 input: ${eventData.date.replace(/-/g, '/') + " " + eventData.startTime}<br/>`;
//  inpagelog.innerHTML += `DEBUG GENDATE01: ${new Date(eventData.date.replace(/-/g, '/') + " " + eventData.startTime).toISOString()}<br/>`;
  // First create resource that will be send to server.
  // 20210406: add .replace(/-/g, '/') for iphone compatibility
    var resource = {
        "summary": eventData.eventTitle,
        "start": {
          "dateTime": new Date(eventData.date.replace(/-/g, '/') + " " + eventData.startTime).toISOString()
        },
         "end": {
          "dateTime": new Date(eventData.date.replace(/-/g, '/') + " " + eventData.endTime).toISOString()
          }
        };
  // inpagelog.innerHTML += `createEvent: created ${JSON.stringify(resource)}<br/>`;

    // create the request
    var request = gapi.client.calendar.events.insert({
      'calendarId': 'primary',
      'resource': resource
    });
    // inpagelog.innerHTML += `adding ${eventData.eventTitle}<br/>`;
    // execute the request and do something with response
    request.execute(function(resp) {
      console.log(resp);
      if (resp && !resp.error) {
        // alert(`Added etag = ${resp.etag}, id = ${resp.id}`);
        inpagelog.innerHTML += `Added etag = ${resp.etag}<br/>`;
        addStatus.innerHTML += `Added etag = ${resp.etag}<br/>`;

      } else {
        // creates infinite loop with http-400        
        // reauthAndReinsert();

        // reauth after whatever failure
        if (resp.code == 400) {
          alert(`fail: HTTP code ${resp.code} and will reload...`);
          location.reload();
        } else if (resp.code == 401) {
          alert(`fail: HTTP code ${resp.code} and will reauthorise...`);
          checkAuth();
        }
      }
      enableAddButton();      
    });
}

function reauthAndReinsert(event) {
    gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, 
                        handleAuthResultWithReinsert);
    return false;
}

function handleAuthResultWithReinsert(authResult) {
    // console.log(`Inside handleAuthResult ...`);
    // console.log(`Inside handleAuthResult ...: ${JSON.stringify(authResult)}`);
    inpagelog.innerHTML += 'Inside handleAuthResult ...<br/>';
    authData = authResult;
    var authorizeButton = document.getElementById('authorize-button');
    var addButton = document.getElementById('addToCalendar');
    if (authResult && !authResult.error) {
          authorizeButton.style.visibility = 'hidden';
          addButton.style.visibility = 'visible'; 
          //load the calendar client library
          gapi.client.load('calendar', 'v3', function(){ 
            // console.log("Calendar library loaded.");
            inpagelog.innerHTML += "Calendar library loaded.<br/>";
            createEvent(getUserInput());
          });
    } else {
          authorizeButton.style.visibility = '';
          authorizeButton.onclick = handleAuthClick;
          inpagelog.innerHTML += authResult.error;
        }
}

// register radio buttons
r01.onclick = doSomething;
r02.onclick = doSomething;
r03.onclick = doSomething;
r04.onclick = doSomething;
r05.onclick = doSomething;
r06.onclick = doSomething;
r07.onclick = doSomething;

function doSomething(e) {
  e = e || window.e; // IE
  target = e.target || e.srcElement; // IE
  habit.value = target.value;
}