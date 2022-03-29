/* copy-paste from https://developers.google.com/identity/oauth2/web/guides/migration-to-gis#gis-and-gapi */
    const gapiLoadPromise = new Promise((resolve, reject) => {
      gapiLoadOkay = resolve;
      gapiLoadFail = reject;
    });
    const gisLoadPromise = new Promise((resolve, reject) => {
      gisLoadOkay = resolve;
      gisLoadFail = reject;
    });

    var tokenClient;
    var addButton = document.getElementById('addToCalendarBtn');
    var addStatus = document.getElementById('addStatus');
    var inpagelog = document.getElementById('inpagelog');   
    var timeWindow = {};

    (async () => {
      document.getElementById("addToCalendarBtn").style.visibility="hidden";
      document.getElementById("revokeBtn").style.visibility="hidden";
      // authorizeButton.onclick = handleAuthClick;
      addButton.onclick = function(){
        // addButton.disabled = true;
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
 
      
      // First, load and initialize the gapi.client
      await gapiLoadPromise;
      await new Promise((resolve, reject) => {
        // NOTE: the 'auth2' module is no longer loaded.
        gapi.load('client', {callback: resolve, onerror: reject});
      });
      await gapi.client.init({
        // NOTE: OAuth2 'scope' and 'client_id' parameters have moved to initTokenClient().
        // ALSO, if you pop an invalid apiKey, then the "Add to Google Calendar" button definitely stops working and gets stuck at "waiting"
        // apiKey: 'AIzaSyBwrfTm8j1glmNnjQMk6LrSR02R5STl06I'
        // from quickstart project apiKey: 'AIzaSyCpUpPqikoXgz0uvMXncXLoJKAVg9j3jTc'
        // Nonetheless, the code still functions without an API Key
      })
      .then(function() {  // Load the Calendar API discovery document.
        gapi.client.load('calendar', 'v3');
      })

      // Now load the GIS client
      await gisLoadPromise;
        await new Promise((resolve, reject) => {
          try {
            tokenClient = google.accounts.oauth2.initTokenClient({
                // from old quickstart project client_id: '245081219628-d5dv2j0gqpe66m3t3i1r39i30q00gkq7.apps.googleusercontent.com',
                // new project, but external OAuth client_id: '868235411176-mr88d60d4mj5i5u50hvdh430g5mt6a28.apps.googleusercontent.com',
                // jadebit project, internal OAuth
                client_id: '17740509153-5ku9if92cdbr0fofg9u7hof5r5no86k7.apps.googleusercontent.com',
                scope: 'https://www.googleapis.com/auth/calendar',
                /* is prompt=consent causing the extra check?  https://developers.google.com/identity/oauth2/web/guides/use-token-model

. By default, user consent is only necessary the first time a user visits your website and requests a new scope but may be requested on every page load using prompt=consent in Token Client config objects.
                  */

                // prompt: 'consent',
                callback: '',  // defined at request time in await/promise scope.
            });
            resolve();
          } catch (err) {
            reject(err);
          }
        });

      addButton.style.visibility="visible";
      document.getElementById("revokeBtn").style.visibility="visible";
    })();

    async function getToken(err) {

      if (err.result.error.code == 401 || (err.result.error.code == 403) &&
          (err.result.error.status == "PERMISSION_DENIED")) {

        // The access token is missing, invalid, or expired, prompt for user consent to obtain one.
        await new Promise((resolve, reject) => {
          try {
            // Settle this promise in the response callback for requestAccessToken()
            tokenClient.callback = (resp) => {
              if (resp.error !== undefined) {
                reject(resp);
              }
              // GIS has automatically updated gapi.client with the newly issued access token.
              inpagelog.innerHTML += `gapi.client access token: ${JSON.stringify(gapi.client.getToken().access_token)} <br>`; 
              resolve(resp);
            };
            tokenClient.requestAccessToken();
          } catch (err) {
            console.log(err)
          }
        });
      } else {
        // Errors unrelated to authorization: server errors, exceeding quota, bad requests, and so on.
        throw new Error(err);
      }
    }



    function revokeToken() {
      let cred = gapi.client.getToken();
      if (cred !== null) {
        google.accounts.oauth2.revoke(cred.access_token, () => { 
          inpagelog.innerHTML += `Revoked: ${cred.access_token} <br>`;
        });
        gapi.client.setToken('');
      }
    }


function enableAddButton() {
      addButton.innerText = "Add to Google Calendar";
      addButton.disabled = false;
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

      var request = gapi.client.calendar.events.insert({
        'calendarId': 'primary',
        'resource': resource      })
      .then(calendarAPIResponse => {
        inpagelog.innerHTML += `Added etag = ${JSON.stringify(calendarAPIResponse.result.etag)}<br/>`;
      })
      .catch(err  => getToken(err) // only retry insert on calling getToken
        .then(retry => gapi.client.calendar.events.insert({ 'calendarId': 'primary',
                                                        'resource': resource }))
        .then(calendarAPIResponse => {
          inpagelog.innerHTML += `Added etag =  ${JSON.stringify(calendarAPIResponse.result.etag)}<br/>`;
        })
        .catch(err  => console.log(err)));  // for authorization errors obtain an access token

      enableAddButton();      

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