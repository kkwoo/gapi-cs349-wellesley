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

var clientId = '245081219628-ti387n6lq6a43gtmetbiv1kvtgd09c6k.apps.googleusercontent.com';
var apiKey = 'AIzaSyDCh7dh8XhSQ58YWIbODV8wJ5jNGTcRb1g';
var scopes = 'https://www.googleapis.com/auth/calendar';
var pagelog = document.getElementById('pagelog')      
      
/* Function invoked when the client javascript library is loaded */
function handleClientLoad() {
  // console.log("Inside handleClientLoad ...");
  pagelog.innerHTML += "Inside handleClientLoad ...<br/>";
  gapi.client.setApiKey(apiKey);
  window.setTimeout(checkAuth,100);
}

/* API function to check whether the app is authorized. */
function checkAuth() {
//  console.log("Inside checkAuth ...");
  pagelog.innerHTML += "Inside checkAuth ...<br/>";
  gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, 
                      handleAuthResult);
}

/* Invoked by different functions to handle the result of authentication checks.*/
var authData;
function handleAuthResult(authResult) {
    // console.log(`Inside handleAuthResult ...`);
    // console.log(`Inside handleAuthResult ...: ${JSON.stringify(authResult)}`);
    pagelog.innerHTML += 'Inside handleAuthResult ...<br/>';
    authData = authResult;
    var authorizeButton = document.getElementById('authorize-button');
    var addButton = document.getElementById('addToCalendar');
    if (authResult && !authResult.error) {
          authorizeButton.style.visibility = 'hidden';
          addButton.style.visibility = 'visible'; 
          //load the calendar client library
          gapi.client.load('calendar', 'v3', function(){ 
            // console.log("Calendar library loaded.");
            pagelog.innerHTML += "Calendar library loaded.<br/>";
          });
    } else {
          authorizeButton.style.visibility = '';
          authorizeButton.onclick = handleAuthClick;
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
addButton.onclick = function(){
  var userChoices = getUserInput();
  console.log(userChoices);
  /* pagelog.innerHTML += JSON.stringify(userChoices);
  pagelog.innerHTML += "<br/>"; */
  if (userChoices) {
    createEvent(userChoices);
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
  document.querySelector(tRef).value = curTime;
  // console.log(curTime);
}

function getUserInput(){
  
  var date = document.querySelector("#date").value;
  var startTime = document.querySelector("#start").value;
  var endTime = document.querySelector("#end").value;
  var eventDesc = document.querySelector("#event").value;
  
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
  pagelog.innerHTML += `START createEvent: ${eventData.eventTitle}, ${eventData.date.replace(/-/g, '/')}, ${eventData.startTime}, ${eventData.endTime}<br/>`;
//  pagelog.innerHTML += `DEBUG GENDATE01 input: ${eventData.date.replace(/-/g, '/') + " " + eventData.startTime}<br/>`;
//  pagelog.innerHTML += `DEBUG GENDATE01: ${new Date(eventData.date.replace(/-/g, '/') + " " + eventData.startTime).toISOString()}<br/>`;
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
  // pagelog.innerHTML += `createEvent: created ${JSON.stringify(resource)}<br/>`;

    // create the request
    var request = gapi.client.calendar.events.insert({
      'calendarId': 'primary',
      'resource': resource
    });
    pagelog.innerHTML += `adding ${eventData.eventTitle}<br/>`;
    // execute the request and do something with response
    request.execute(function(resp) {
      console.log(resp);
      if (resp && !resp.error) {
        // alert(`Added etag = ${resp.etag}, id = ${resp.id}`);
        pagelog.innerHTML += `Added etag = ${resp.etag}, id = ${resp.id}<br/>`;

      } else {
        alert(`fail: ${resp.code}, ${resp.error.message} and will retry...`);
        gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, 
          y => {
            request.execute(x => {
                (x && !x.error) ? alert(`post-failure success - ${x.etag}: ${x.message}`) : alert(`post-failure failure - ${x.code}: ${x.error.message}`)
            });
          });
      }
    });
}