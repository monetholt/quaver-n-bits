// document.addEventListener('DOMContentLoaded', (event) => {
//     let req = new XMLHttpRequest();
//     let url = 'https://soundcloud.com/milklab/nate-kimball-orchestra-namaste';
//     req.open('GET', `https://cors-anywhere.herokuapp.com/${url}`, true);
//     req.addEventListener('load', () => {
//         let res = req.responseText;
//         if (req.status < 400) {
//             // console.log(res);
//             console.log("YAY!");
//             let number = res.match(/soundcloud:\/\/sounds:(\d{9})/);
//             console.log(number[1]);
//             let iframe = `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${number[1]}`;
//             console.log(iframe);
//         }
//     });
//     req.send(null);
// });

// Global placeholder for state.
let allAds = {}

// Initial ad fetch when /dashboard is rendered.
document.addEventListener('DOMContentLoaded', (event) => {
    let req = new XMLHttpRequest();
    req.open('GET', '/dashboard/ads', true);
    req.addEventListener('load', () => {
        let res = JSON.parse(req.responseText);
        if (req.status < 400) {
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
            console.log("WHOOPS!");
        }
    });
    document.getElementById('current-ads-loading').hidden = false;
    document.getElementById('previous-ads-loading').hidden = false;
    document.getElementById('no-current-ads').hidden = true;
    document.getElementById('no-previous-ads').hidden = true;
    req.send(null);
});

// Show an alert with type (either "success" or "warning"). Pass a template string to display that formatted text.
function showAlert(type, icon, text) {
    let alert = document.getElementById('alert-popout');
    alert.innerHTML = `<i class="${icon}"></i>${text}`;
    alert.hidden = false;
    alert.classList.add(type);
    alert.classList.remove('hidden');
    setTimeout(
        function() {
            alert.classList.add('hidden');
            alert.classList.remove(type);
        }, 2500);
}

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
                        ${ createInstrumentList(thisAd.instruments) }
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
                '<button class="button primary large"><i class="fas fa-search"></i>View Matches</button>' +
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
                    ${thisAd.IsActive === 1 ? '<i class="fas fa-broadcast-tower"></i> Within <strong>' + (thisAd.LocationRadius === 0 ? 'Any' : thisAd.LocationRadius) + '</strong> miles of <strong>' + thisAd.ZipCode + '</strong>' : '<i class="fas fa-microphone-alt-slash"></i>This ad is currently <strong>inactive</strong>.'}                            
                </div>
            </div>
        </div>
        <div class="grid-x display-ads-ad-body">
            <div class="cell medium-8 display-ads-ad-description">
                <p>${thisAd.Description}</p>
                
            </div> 
            <div class="cell medium-4 display-ads-ad-instruments">
                <h6>What I'm looking for: </h6>
                <ul>
                ${ createInstrumentList(thisAd.instruments) }
                </ul>
            </div> 
        </div>
        `;

    return currentAd;
}

// Toggles the edit ad view (duh).
function toggleEditAdView(id){
    let thisView = document.getElementById(`display-ads-edit-overlay-${id}`);
    thisView.hidden = !thisView.hidden;
}

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
                    showAlert("successs", "far fa-check-circle", "Ad saved!");

                    //update data for this ad:
                    allAds[id]['Title'] = newTitle;
                    allAds[id]['Radius'] = radius;
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

function createInstrumentList(instruments) {
    let list = ``;
    for (let i in instruments) {
        list += `<li><span class='inst-list-quantity' data-val='${instruments[i]['Quantity']}'>${instruments[i]['Quantity']}</span> 
                <span class='inst-list-level' data-val='${instruments[i]['LevelKey']}'>${instruments[i]['Level']}-Level</span> 
                <span class='inst-list-inst' data-val='${instruments[i]['InstrumentKey']}'><strong>${instruments[i]['Instrument']}</strong></span></li>`;
    }
    return list;
}

//abandoned but leaving this in here in case we want to change the ui to not have ad edit instruments be in a popup
//to use we would have to put this line before return statement in createAd(): $(currentAd).find(".ads-edit-instruments-section").append(createInstrumentListEditable(thisAd.AdKey, thisAd.instruments));
//function createInstrumentListEditable(adID, instruments) {
//    var instSelect = $("#instrument-list").clone(); //make a copy of the instrument selector
//    instSelect.attr("id", "instrument-list-" + adID).attr("name", "instrument-list"); //update id/name
//    instSelect.attr("data-select2-id", "").attr("class", "");

//    var html = $('<div></div>').append("<div class='inst-div'></div>");
//    html.find(".inst-div").append(instSelect); //put the instrument selector in its own div
//    html.append("<div class='instrument-selection-edit'></div>"); //underneath the selector will be our list of selected instruments

//    $.each(instruments, function (i, instrument) { //iterate through each existing instrument to ad it.
       
//        var thisSelection = $("<div class='instrument-selection-item-edit' data-inst-id='" + instrument['InstrumentKey'] + "'></div>"); 
//        thisSelection.append("<div class='delete-selection'>X</div>");
//        thisSelection.append("<div class='instrument-selection-text'>" + instrument['Instrument'] + "</div>");

//        var levelSelect = $("#level-list-main").clone(); //make a copy of the level selector
//        levelSelect.attr("id", "level-list-" + adID).attr("name", "level-list").css("display", "inline-block"); //replace id/name and make it visible
//        levelSelect.val(instrument['LevelKey']); //set the value to whatever level this instrument currently is
//        thisSelection.append(levelSelect); //add it to this section

//        html.find(".instrument-selection-edit").append(thisSelection);
//    });


//    return html;
//}



//returns a list of the instruments in the edit form of the passed id
function getEditInstruments(id) {
    //Go to the edit form for this add and grab all instruments
    let adInstruments = $("#display-ads-edit-overlay-" + id).find(".ads-edit-instruments-section").find("li");

    let instrumentList = [];

    //add instruments to array
    adInstruments.each(function () {
        let instID = $(this).find(".inst-list-inst").attr("data-val");
        let levelID = $(this).find(".inst-list-level").attr("data-val");
        let quantity = $(this).find(".inst-list-quantity").attr("data-val");
        let instName = $(this).find(".inst-list-inst").text();
        let levelName = $(this).find(".inst-list-level").text().split("-")[0];

        instrumentList.push({
            "InstrumentKey": instID,
            "LevelKey": levelID,
            "Quantity": quantity,
            "Instrument": instName,
            "Level": levelName
        });
    });

    //return list of instruments
    return instrumentList;
}


//clears and resets the edit instrument popup
function clearInstrumentsEditForm() {
    $("#instrument-selection-edit").html(""); //clear out any selected instruments
    $("#instrument-section-edit-btn").attr("data-id", 0).unbind(); //clear out any id and event attached to this form.
    $("#error-msg-edit").html(""); //clear out any error msg
}


//populates edit instrument form with instruments in the passed ad's edit form
function populateInstrumentsEditForm(id) {
    
    let instruments = getEditInstruments(id); //get instrument data from edit form

    $.each(instruments, function (i, instrument) {
        var sectionID = addSelection(instrument.InstrumentKey, instrument.Instrument, "edit"); //add this instrument to the form
        $("#" + sectionID).find("#level-" + sectionID).val(instrument.LevelKey); //set the level
        $("#" + sectionID).find("#quantity-" + sectionID).val(instrument.Quantity); //set the quantity
    });
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
                let instrumentHtml = createInstrumentList(selected); //otherwise convert selections back to text and put in ad edit form
                $("#display-ads-edit-overlay-" + id).find(".ads-edit-instruments-section").html(instrumentHtml);

                $("#modal-edit-ad-instruments").foundation('close'); //close popup
            }
        }
    });

    $("#modal-edit-ad-instruments").foundation('open'); //show form to user
}

//when passed an instrument id + name, will add a new section under the instrument select so the user can select level or delete.
//will show user an error if they try to add the same instrument twice
function addSelection(id, inst, addOrEdit) {
    var selectionDiv = $("#instrument-selection-" + addOrEdit); //grab section below instrument select

    var thisId = id + "-" + Date.now();

    selectionDiv.append("<div class='instrument-selection-item' id='" + thisId +"'></div>"); //add a new 'box' for this selected instrument

    var thisSelection = selectionDiv.find("#" + thisId);

    thisSelection.append("<div class='delete-selection'>X</div>"); //add the icon to delete this section
    var levelSelect = $("#level-list-main-" + addOrEdit).clone(); //copy the existing level selector so this instrument can have its own
    levelSelect.attr("id", "level-" + thisId); //set the id for the level select + unhide it
    levelSelect.css("display", "inline-block");

    thisSelection.append("<div class='instrument-selection-text'>" + inst + "</div>");
    thisSelection.append(levelSelect);
    thisSelection.append("<input placeholder='Quantity' type='number' class='selection-quantity'  id='quantity-" + thisId+"' value='1' min='1' max='99' />");

    return thisId;
}

$(document).ready(function () {

    //set up the instrument to use select2 for easy searching+selecting. This seemed closest to the datalist we were using
    $('#instrument-list-add, #instrument-list-edit').select2({
        placeholder: "Select an instrument"
    }).on('select2:select', function (e) {
        //whenever we select a new instrument, add it to the section below to select level
        var selectedOption = e.params.data;
        addSelection(selectedOption.id, (selectedOption.text), $(this).attr("id").split("-")[2]);
    });

    //click event to remove selected instruments.
    $("body").on("click", ".delete-selection", function () {
        $(this).parent().remove();
    });

    $("#modal-edit-ad-instruments").on("closed.zf.reveal", function () {
        clearInstrumentsEditForm();
    });

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