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
            console.log(res);
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

            console.log(allAds);
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
                <div class="cell medium-4 ads-edit-instruments">
                    <label for="ads-edit-instruments-${thisAd.AdKey}">Instruments:</label>
                    <ul>
                        ${ createInstrumentList(thisAd.instruments) }
                    </ul>
                </div>
            </div>
            <div class="grid-x ads-edit-footer">
                <div class="cell medium-3 ads-edit-cancel">
                    <button class="button alert large expanded" onclick="toggleEditAdView(${thisAd.AdKey})"><i class="far fa-window-close"></i>Cancel</button>
                </div>
                <div class="cell medium-9 ads-edit-save">
                    <button data-ad-id="${thisAd.AdKey}" class="ads-edit-save-btn button primary large expanded"><i class="fas fa-share"></i>Save Ad</button>
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
        list += `<li>${instruments[i]['Level']}-Level <strong>${instruments[i]['Instrument']}</strong></li>`;
    }
    return list;
}

//when passed an instrument id + name, will add a new section under the instrument select so the user can select level or delete.
//will show user an error if they try to add the same instrument twice
function addSelection(id, inst) {
    var selectionDiv = $("#instrument-selection"); //grab section below instrument select

    var thisId = id + "-" + Date.now();

    selectionDiv.append("<div class='instrument-selection-item' id='" + thisId +"'></div>"); //add a new 'box' for this selected instrument

    var thisSelection = selectionDiv.find("#" + thisId);

    thisSelection.append("<div class='delete-selection'>X</div>"); //add the icon to delete this section
    var levelSelect = $("#level-list-main").clone(); //copy the existing level selector so this instrument can have its own
    levelSelect.attr("id", "#level-" + thisId); //set the id for the level select + unhide it
    levelSelect.css("display", "block");

    thisSelection.append("<div class='instrument-selection-text'>" + inst + "</div>");
    thisSelection.append(levelSelect);
    thisSelection.append("<input placeholder='Quantity' type='number' class='selection-quantity'  id='quantity-" + thisId+"' min='1' max='99' />");

}

$(document).ready(function () {

    //set up the instrument to use select2 for easy searching+selecting. This seemed closest to the datalist we were using
    $('#instrument-list').select2({
        placeholder: "Select an instrument"
    }).on('select2:select', function (e) {
        //whenever we select a new instrument, add it to the section below to select level
        var selectedOption = $("#instrument-list").select2('data')[0];
        addSelection(selectedOption.id, (selectedOption.text));
    });

    //click event to remove selected instruments.
    $("body").on("click", ".delete-selection", function () {
        $(this).parent().remove();
    });

    $("#addAd").submit(function (e) {
        e.preventDefault();
        $("#error-msg-ad").html("");

        var form = this;

        //get all selected instruments
        var selectedInstruments = $(".instrument-selection-item");

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


    //on update ad save btn click
    $("body").on("click", ".ads-edit-save-btn", function (e) {
        var adID = $(this).attr("data-ad-id"); //get the id of the ad we are trying to update
        var editForm = $("#display-ads-edit-overlay-"+adID); //grab the form so we can get the values.

        var newTitle = editForm.find("[name='ads-edit-title']").val() == undefined ? "": editForm.find("[name='ads-edit-title']").val().trim(); //get those values
        var radius = editForm.find("[name='ads-edit-radius']").val();
        var zipcode = editForm.find("[name='ads-edit-loc']").val() == undefined ? "" : editForm.find("[name='ads-edit-loc']").val().trim();
        var description = editForm.find("[name='ads-edit-description']").val() == undefined  ? "" : editForm.find("[name='ads-edit-description']").val().trim();

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
            //if no errors, go ahead and send to server to save.
            $.ajax({
                type: "POST",
                url: "/dashboard/ads/edit",
                data: {
                    "ad-id": adID,
                    "ad-title": newTitle,
                    "ad-radius": radius,
                    "ad-zip": zipcode,
                    "ad-text": description,
                },
                success: function (data, textStatus, jqXHR) {
                    //data - response from server
                    if (data.success == 1) {
                        showAlert("successs", "far fa-check-circle", "Ad saved!");

                        //update data for this ad:
                        allAds[adID]['Title'] = newTitle;
                        allAds[adID]['Radius'] = radius;
                        allAds[adID]['ZipCode'] = zipcode;
                        allAds[adID]['Description'] = description;

                        $("#display-ads-ad-" + adID).remove(); //delete the current ad from the list

                        $("#current-ads").prepend(createAd(allAds[adID])); //create a new version and at it at the top

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
    });

});