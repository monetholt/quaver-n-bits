// Global placeholder for state.
let allAds = {}

// Initial ad fetch when /dashboard is rendered.
document.addEventListener('DOMContentLoaded', (event) => {
    let req = new XMLHttpRequest();
    req.open('GET', '/dashboard/ads', true);
    req.addEventListener('load', () => {
        let res = JSON.parse(req.responseText);
        if (req.status < 400) {
            $("[name='sortOrder']").val(res.sort);
            if (res.has_current_ads) {
                document.getElementById('current-ads-loading').hidden = true;
                let currentAds = document.getElementById('current-ads');
                for (let ad in res.current_ads) {
                        currentAds.appendChild(createAd(res.current_ads[ad]));
                        allAds[res.current_ads[ad]['AdKey']] = res.current_ads[ad];
                }
            } else {
                document.getElementById('current-ads-loading').hidden = true;
                document.getElementById('no-current-ads').hidden = false;
            }

            if (res.has_prev_ads) {
                document.getElementById('previous-ads-loading').hidden = true;
                let previousAds = document.getElementById('previous-ads');
                for (let ad in res.prev_ads) {
                    previousAds.appendChild(createAd(res.prev_ads[ad]));
                    allAds[res.prev_ads[ad]['AdKey']] = res.prev_ads[ad];
                }
            } else {
                document.getElementById('previous-ads-loading').hidden = true;
                document.getElementById('no-previous-ads').hidden = false;
            }
        } else {
            showAlert("alert", "fa-exclamation-triangle", `Something went wrong trying to fetch the ads. Please try again later.`)
        }
    });
    document.getElementById('current-ads-loading').hidden = false;
    document.getElementById('previous-ads-loading').hidden = false;
    document.getElementById('no-current-ads').hidden = true;
    document.getElementById('no-previous-ads').hidden = true;
    req.send(null);
});


// The function that creates & assembles the HTML for the div element containing a new ad.
// Returns a <div> element (ad).
function createAd(thisAd) {
    let currentAd = document.createElement('div');
    currentAd.id = 'display-ads-ad-' + thisAd.AdKey;
    currentAd.className = 'display-ads-ad';
    currentAd.innerHTML = `
        <div id="display-ads-edit-overlay-${thisAd.AdKey}" class="display-ads-edit-overlay" hidden>
            <div class="grid-x ads-edit-header">
                <div class="cell medium-12 ads-edit-editing">
                    <div class="ads-edit-editing-text">
                        <i class="far fa-edit"></i>Editing Ad: <strong>${thisAd.Title}</strong>    
                    </div>
                </div>
                <div class="cell medium-6 ads-edit-title">
                    <label for="ads-edit-title-${thisAd.AdKey}">Title:</label>
                    <input type="text" name="ads-edit-title" id="ads-edit-title-${thisAd.AdKey}" value="${thisAd.Title}">
                </div>
                <div class="cell medium-3 ads-edit-radius">
                    <label for="ads-edit-radius-${thisAd.AdKey}">Search Radius:</label>
                    <select name="ads-edit-radius" id="ads-edit-radius-${thisAd.AdKey}">
                        <option value="99999">Any</option>
                        <option value="5">5 Miles</option>
                        <option value="10">10 Miles</option>
                        <option value="25">25 Miles</option>
                        <option value="50">50 Miles</option>
                        <option value="100">100 Miles</option>
                    </select>
                </div>
                <div class="cell medium-3 ads-edit-loc">
                    <label for="ads-edit-loc-${thisAd.AdKey}">Zip Code:</label>
                    <input type="text" name="ads-edit-loc" id="ads-edit-loc-${thisAd.AdKey}" value="${thisAd.ZipCode}">
                </div>
            </div>
            <div class="grid-x ads-edit-body">
                <div class="cell medium-8 ads-edit-description">
                    <label for="ads-edit-description-${thisAd.AdKey}">Description:</label>
                    <textarea name="ads-edit-description" id="ads-edit-description-${thisAd.AdKey}" rows="5">${thisAd.Description}</textarea>
                </div>
                <div class="cell medium-4 ads-edit-instruments" onclick="selectInstrumentsEdit(${thisAd.AdKey})">
                    <label for="ads-edit-instruments-${thisAd.AdKey}">Instruments:</label>
                    <ul class="ads-edit-instruments-section">
                        ${ createInstrumentList(thisAd.instruments, true) }
                    </ul>
                </div>
            </div>
            <div class="grid-x ads-edit-footer">
                <div class="cell medium-3 ads-edit-cancel">
                    <button class="button alert large expanded" onclick="toggleEditAdView(${thisAd.AdKey})"><i class="far fa-window-close"></i>Cancel</button>
                </div>
                <div class="cell medium-9 ads-edit-save">
                    <button data-ad-id="${thisAd.AdKey}" class="ads-edit-save-btn button primary large expanded" onclick="updateAd(${thisAd.AdKey})"><i class="fas fa-share"></i>Save Ad</button>
                </div>
            </div>
        </div>
        <div class="display-ads-ad-overlay">
            ${thisAd.IsActive === 1 ? 
                '<button class="button primary large" onclick="location.href=\'/search-results/'+ thisAd.AdKey + '\'"><i class="fas fa-search"></i>Search Results</button>' +
                '<button class="button secondary large" onclick="toggleEditAdView(' + thisAd.AdKey + ')"><i class="far fa-edit"></i>Edit Ad</button>' +
                '<button class="button warning large" onclick="toggleEnableAd(' + thisAd.AdKey + ')"><i class="fas fa-microphone-alt-slash"></i>Disable Ad</button>' :
                '<button class="button secondary large" onclick="toggleEnableAd(' + thisAd.AdKey + ')"><i class="fas fa-sync"></i>Enable Ad</button>'
            }
            <button class="button alert large" onclick="deleteAd(${thisAd.AdKey})"><i class="fas fa-dumpster-fire"></i>Delete Ad</button>
        </div>
        <div class="grid-x display-ads-ad-header">
            <div class="cell medium-6 display-ads-ad-title">
                <h2>${thisAd.Title}</h2>
                <h5>${thisAd.DatePosted === thisAd.LastUpdated ? "Posted" : "Updated"} ${moment(thisAd.DatePosted).subtract(7, 'hours').add(5, 'minutes').fromNow()}</h5>
            </div>
            <div class="cell medium-6 display-ads-ad-loc">
                <div class="display-ads-ad-loc-display">
                    ${thisAd.IsActive === 1 ? '<i class="fas fa-broadcast-tower"></i> Within <strong>' + (thisAd.LocationRadius == 99999 ? 'Any' : thisAd.LocationRadius) + '</strong> miles of <strong>' + thisAd.ZipCode + '</strong>' : '<i class="fas fa-microphone-alt-slash"></i>This ad is currently <strong>inactive</strong>.'}                            
                </div>
            </div>
        </div>
        <div class="grid-x display-ads-ad-body">
            <div class="cell medium-8 display-ads-ad-description"><p>${thisAd.Description}</p></div> 
            <div class="cell medium-4 display-ads-ad-instruments">
                <h6>What I'm looking for: </h6>
                <ul>
                ${ createInstrumentList(thisAd.instruments, true) }
                </ul>
            </div> 
        </div>
        `;

    $(currentAd).find("#ads-edit-radius-" + thisAd.AdKey).val(thisAd.LocationRadius); //set radius value in edit form

    return currentAd;
}

// Toggles the edit ad view (duh).
function toggleEditAdView(id){
    let thisView = document.getElementById(`display-ads-edit-overlay-${id}`);
    thisView.hidden = !thisView.hidden;
}

// this was me playing around with using a function to XMLHTTPrequest the 
// post function but it didn't make sense when all of the adds had to reload
// so this function can be deleted if we want 
/* 
function filterSelection(sortFilter) {
     let payload = {sortOrder: sortFilter};
}
*/
// Send a request to /dashboard/ads/enable to toggle the state of "IsActive" for this ad.
// Updates the UI by removing the node from where it was and appending it to where it should be.
// Alerts the user with a success message after it's done, or error message if something bad happened.
function toggleEnableAd(id) {
    let payload = {AdKey: id, IsActive: allAds[id].IsActive === 1 ? 0 : 1 };

    let req = new XMLHttpRequest();
    req.open('PUT', `/dashboard/ads/enable`, true);
    req.addEventListener('load', () => {
        if (req.status < 400) {
            // Update the state.
            allAds[id].IsActive = allAds[id].IsActive === 1 ? 0 : 1;

            // Remove the ad from where it was.
            let oldAd = document.getElementById(`display-ads-ad-${id}`);
            oldAd.parentNode.removeChild(oldAd);

            // Recreate it and put it where it should be, alerting the user.
            if (allAds[id].IsActive === 1) {
                document.getElementById('current-ads').appendChild(createAd(allAds[id]));
                showAlert("success", "far fa-check-circle", `Your ad <span>${allAds[id]['Title']}</span> is now enabled.`);
            } else {
                document.getElementById('previous-ads').appendChild(createAd(allAds[id]));
                showAlert("caution", "fas fa-microphone-alt-slash", `Your ad <span>${allAds[id]['Title']}</span> is now disabled.`);
            }
        } else {
            // Ohgodnonono.
            showAlert("alert", "fa-exclamation-triangle", `Something went wrong trying to update <span>${allAds[id]['Title']}</span>. Please try again later.`)
        }
    });
    req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
    req.send(JSON.stringify(payload));
}

function updateAd(id) {
    var editForm = $("#display-ads-edit-overlay-" + id); //grab the form so we can get the values.

    var newTitle = editForm.find("[name='ads-edit-title']").val() == undefined ? "" : editForm.find("[name='ads-edit-title']").val().trim(); //get those values
    var radius = editForm.find("[name='ads-edit-radius']").val();
    var zipcode = editForm.find("[name='ads-edit-loc']").val() == undefined ? "" : editForm.find("[name='ads-edit-loc']").val().trim();
    var description = editForm.find("[name='ads-edit-description']").val() == undefined ? "" : editForm.find("[name='ads-edit-description']").val().trim();

    //do some validation
    if (newTitle == "") {
        showAlert("warning", "fa fa-exclamation-triangle", "Please enter a title before saving your ad.");
    }
    else if (radius < 1) {
        showAlert("warning", "fa fa-exclamation-triangle", "Please select a radius before saving your ad.");
    }
    else if (zipcode == "") {
        showAlert("warning", "fa fa-exclamation-triangle", "Please enter a zipcode.");
    }
    else {
        let selectedInstruments = getEditInstruments(id); //instruments in the ad form

        //if no errors, go ahead and send to server to save.
        $.ajax({
            type: "POST",
            url: "/dashboard/ads/edit",
            data: {
                "ad-id": id,
                "ad-title": newTitle,
                "ad-radius": radius,
                "ad-zip": zipcode,
                "ad-text": description,
                "instruments": selectedInstruments,
            },
            success: function (data, textStatus, jqXHR) {
                //data - response from server
                if (data.success == 1) {
                    showAlert("success", "far fa-check-circle", "Ad saved!");

                    //update data for this ad:
                    allAds[id]['Title'] = newTitle;
                    allAds[id]['LocationRadius'] = radius;
                    allAds[id]['ZipCode'] = zipcode;
                    allAds[id]['Description'] = description;
                    allAds[id]['instruments'] = selectedInstruments;


                    $("#display-ads-ad-" + id).remove(); //delete the current ad from the list
                    $("#current-ads").prepend(createAd(allAds[id])); //create a new version and at it at the top
                }
                else {
                    showAlert("warning", "fa fa-exclamation-triangle", "Error saving ad.");
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                showAlert("warning", "fa fa-exclamation-triangle", "Error saving ad.");
            },
            dataType: 'json'
        });
    }
}

// Sends a request to /dashboard/ads/delete to remove this ad and its associated instruments from the user's account.
// Updates the UI by removing the element from its parent.
// Shows a success/failure notification to the user.
function deleteAd(id) {
    let req = new XMLHttpRequest();
    req.open('DELETE', `/dashboard/ads/delete`, true);
    req.addEventListener('load', () => {
        if (req.status < 400) {
            // Target deleted ad and remove from view.
            let oldAd = document.getElementById(`display-ads-ad-${id}`);
            oldAd.parentNode.removeChild(oldAd);

            // Show alert to user, then update state.
            showAlert("warning", "fas fa-dumpster-fire", `Your ad <span>${allAds[id]['Title']}</span> has been deleted.`);
            delete allAds[id];
        } else {
            // Whoopsie.
            showAlert("alert", "fa-exclamation-triangle", `Something went wrong trying to delete <span>${allAds[id]['Title']}</span>. Please try again later.`)
        }
    });
    req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
    req.send(JSON.stringify({AdKey: id}));
}


function selectInstrumentsEdit(id) {
    clearInstrumentsEditForm(); //make sure any stale info is cleared from form
    populateInstrumentsEditForm(id); //populate form with this ad info

    //add event on save to put instruments back into main form.
    $("#instrument-section-edit-btn").attr("data-id", id).click(function () {

        $("#error-msg-edit").html(""); //clear out any error msg

        var selectedInstruments = $("#modal-edit-ad-instruments").find(".instrument-selection-item"); //get all selected instruments

        //make sure the user chose at least one
        if (selectedInstruments.length < 1) {
            $("#error-msg-edit").html("Please select at least one instrument");
        }
        else
        {
            //gather IDs + make sure levels are all selected
            var errorMsg = ""; //this will be non-blank if we find an error
            var selected = [];
            var idlevelcombos = []; //instrument/level combo must be unique so create an array to check

            selectedInstruments.each(function () {
                var instID = $(this).attr("id").split("-")[0]; //get the instrument ID
                var levelID = $(this).find("select.selection-level").val(); //get the levelID
                var quantity = $(this).find("input.selection-quantity").val(); //get the quantity
                var instrumentName = $(this).find(".instrument-selection-text").text();
                var levelName = $(this).find("select.selection-level").find("option:selected").text();


                if (levelID < 1) { //this instrument doesnt have a level selected
                    errorMsg = "Please select an experience level for each instrument";
                    return false;
                }
                else if (quantity == "" || quantity < 1) {
                    errorMsg = "Please select a quantity for each instrument";
                    return false;
                }
                else if ($.inArray(instID + "-" + levelID, idlevelcombos) !== -1) {
                    errorMsg = "Hey, if you select more than one of the same instrument you need to select different levels for each";
                    return false;
                }
                else {
                    selected.push({
                        "InstrumentKey": instID,
                        "LevelKey": levelID,
                        "Quantity": quantity,
                        "Instrument": instrumentName,
                        "Level": levelName
                    }); //add the ids to our data array

                    idlevelcombos.push(instID + "-" + levelID); //add the ids combo to our lookup
                }
            });

            if (errorMsg != "") { //if we found an error, show it

                $("#error-msg-edit").html(errorMsg);
            }
            else {
                let instrumentHtml = createInstrumentList(selected, true); //otherwise convert selections back to text and put in ad edit form
                $("#display-ads-edit-overlay-" + id).find(".ads-edit-instruments-section").html(instrumentHtml);

                $("#modal-edit-ad-instruments").foundation('close'); //close popup
            }
        }
    });

    $("#modal-edit-ad-instruments").foundation('open'); //show form to user
}


$(document).ready(function () {

    $("#addAd").submit(function (e) {
        e.preventDefault();
        $("#error-msg-ad").html("");

        var form = this;

        //get all selected instruments
        var selectedInstruments = $("#modal-create-ad").find(".instrument-selection-item");

        //make sure the user chose at least one
        if (selectedInstruments.length < 1) {
            $("#error-msg-ad").html("Please select at least one instrument");
        }
        else {

            //gather IDs + make sure levels are all selected
            var errorMsg = ""; //this will be non-blank if we find an error
            var selected = [];
            var idlevelcombos = []; //

            selectedInstruments.each(function () {
                var instID = $(this).attr("id").split("-")[0]; //get the instrument ID
                var levelID = $(this).find("select.selection-level").val(); //get the levelID
                var quantity = $(this).find("input.selection-quantity").val(); //get the quantity


                if (levelID < 1) { //this instrument doesnt have a level selected
                    errorMsg = "Please select an experience level for each instrument";
                    return false;
                }
                else if (quantity == "" || quantity < 1) {
                    errorMsg = "Please select a quantity for each instrument";
                    return false;
                }
                else if ($.inArray(instID + "-" + levelID, idlevelcombos) !== -1)
                {
                    errorMsg = "Hey, if you select more than one of the same instrument you need to select different levels for each";
                    return false;
                }
                else
                {
                    selected.push([instID, levelID, quantity]); //add the ids to our data array
                    idlevelcombos.push(instID+"-"+levelID); //add the ids combo to our lookup

                }
            });

            if (errorMsg != "") { //if we found an error, show it

                $("#error-msg-ad").html(errorMsg);
            }
            else {
                //transfer over selected ids to hidden inputs in create form
                $("#instrument-selections").html("");
                $.each(selected, function (i, vals) {
                    $("#instrument-selections").append("<input type='text' name='InstrumentID-" + i + "' value='" + vals[0] + "'>");
                    $("#instrument-selections").append("<input type='text' name='LevelID-" + i + "' value='" + vals[1] + "'>");
                    $("#instrument-selections").append("<input type='text' name='Quantity-" + i + "' value='" + vals[2] + "'>");

                });

                form.submit(); // submit the form if everything is good!
            }
        }
    });
});