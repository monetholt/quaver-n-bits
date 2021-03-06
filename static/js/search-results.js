//update match btn of passed profile ID to show pending btn
function updateBtn(profileID) {
    $("#search-result-actions-" + profileID).html('<button class="button dark expanded disabled" disabled><i class="fas fa-bolt"></i>Pending Match</button>');
}


// function to request a match with a searched user's profile
//adID is the id of this ad, proileID is the profile to match with
function request2Match(AdID, ProfileID) {
    $.ajax({
        type: "POST",
        url: "/matches/add",
        data: {
            "AdID": AdID, //pass ad ID and the profile to match with
            "MatchedProfileID": ProfileID,
        },
        success: function (data, textStatus, jqXHR) {
            //data - response from server
            if (data.success == 1) {
                showAlert("success", "far fa-check-circle", "Match requested!"); //success! Show message
                updateBtn(ProfileID); //update the btn for this match request to show pending
            }
            else {
                showAlert("warning", "fa fa-exclamation-triangle", "Error requesting to match."); //something went wrong
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            showAlert("warning", "fa fa-exclamation-triangle", "Error requesting to match.");
        },
        dataType: 'json'
    });
}


document.addEventListener('DOMContentLoaded', (event) => {

     filterByZipCode();
     randomBG();

     // Deletes any children in the DOM that are outside of the given zip code radius.
     function filterByZipCode() {

         // Check for origin. If it doesn't exist, no need to do anything (no results).
         if (!document.getElementById('adzipcode')) { return; }

         // Get the origin zip and radius.
         let origin = document.getElementById('adzipcode').value;
         let radius = document.getElementById('adlocrad').value;

         // Only perform search if radius is greater than 0, since 0 indicates the ad searches any location.
         if (radius < 99999) {

             // API Key (we might want to move this).
             const key = 'js-tdNwFATA32aht796TZoLdODFiay74Fs5Kj4eTsOobne4ZWjs8uDmItN8K1GQKOph';

             // Open request to ZipCodeAPI to get all zips that are within the given radius of this origin.
             let req = new XMLHttpRequest();
             req.open('GET', `https://www.zipcodeapi.com/rest/${key}/radius.json/${origin}/${radius}/mile?minimal`, true);
             req.addEventListener('load', () => {
                 if (req.status < 400) {
                     // Get the response as an array of zip codes.
                     let zips = JSON.parse(req.responseText)["zip_codes"];

                     // Get the parent holding the search results and all of its child nodes.
                     let parent = document.getElementById('search-results');
                     let children = parent.children;

                     // Iterate through the children. If the child's zip is not in the radius zips, remove it.
                     Object.values(children).forEach(child => {
                         if (!zips.includes(child.getAttribute('data-zip'))) {
                             parent.removeChild(child);
                         }
                     });

                     // Hide the loading placeholder.
                     document.getElementById('search-results-loading').classList.add('hidden');

                     // If all of the children got removed after checking the radius, display the "no matches" message.
                     if (parent.children.length == 0) {
                         document.getElementById('no-matches').classList.remove('hidden');
                     // Otherwise, show the proper matches.
                     } else {
                         document.getElementById('search-results').classList.remove('hidden');
                     }
                 } else {
                     showAlert("caution", "fas fa-exclamation-triangle", `Something went wrong trying to search in your zip code radius. Please try again later.`)
                 }
             });

             // We're limited on requests, so comment this out to test non zip code related things.
             req.send(null);
         } else {
             // If there are matches and they are all "any" radius, hide the loading placeholder and just show them.
             document.getElementById('search-results-loading').classList.add('hidden');
             document.getElementById('search-results').classList.remove('hidden');
         }
     }
     function randomBG() {
         let header = document.getElementsByClassName('search-result-header');
         Object.values(header).forEach(result => {
             let variance = 40;
             let rand1 = Math.random() * (360 - 200) + 200;
             let rand2 = rand1 - variance < 0 ? rand1 - variance + 360 : rand1 - variance;
             result.style.backgroundImage = `linear-gradient(to bottom right, hsl(${rand1}, 70%, 50%), hsl(${rand2}, 70%, 50%))`;
         });
     }
 });

