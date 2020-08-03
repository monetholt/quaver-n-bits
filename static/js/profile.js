window.addEventListener('DOMContentLoaded', bindButtons);

function bindButtons() {

    // Bind each edit button function when the DOM is loaded.
    editHeader();
    editAbout();
    editSocial();
    editVideo();

    function editHeader() {

        // Edit button for header content.
        let headerEditBtn = document.getElementById('edit-header');

        // Boolean to determine if we're in edit mode on the header.
        let isEditingHeader = false;

        // The request to build if edits are made. Defaults to current values.
        let req = {
            zipCode: document.getElementById('edit-title-loc-input').value,
            artistName: document.getElementById('edit-title-text-input').value,
            privacySwitch: document.getElementById('privacySwitch').getAttribute('checked') === 'true' ? 1 : 0
        }

        headerEditBtn.addEventListener('click', () => {

            // Boolean to determine if anything has changed.
            let valuesChanged = false;

            // Grab all of the viewable elements in the header
            let displayTitle = document.getElementById('profile-header-title-text');
            let displayLoc = document.getElementById('profile-header-title-loc');
            let displayPrivacy = document.getElementById('profile-head-title-privacy');
            let joinedDate = document.getElementById('profile-header-joined-date');

            // Grab all of the editable elements in the header
            let editTitle = document.getElementById('edit-title-text');
            let editLoc = document.getElementById('edit-title-loc');
            let privacySwitch = document.getElementById('edit-title-privacy-switch');

            // Toggle the visibility of all header elements (switch from 'view' to 'edit').
            displayTitle.hidden = !displayTitle.hidden;
            displayLoc.hidden = !displayLoc.hidden;
            displayPrivacy.hidden = !displayPrivacy.hidden;
            joinedDate.hidden = !joinedDate.hidden;
            editTitle.hidden = !editTitle.hidden;
            editLoc.hidden = !editLoc.hidden;
            privacySwitch.hidden = !privacySwitch.hidden;

            // If the user is about to edit, animate the edit button and edit elements.
            if (!isEditingHeader) {
                headerEditBtn.classList.add('edit-button-animate-in');
                editTitle.classList.add('edit-text-anim');
                editLoc.classList.add('edit-text-anim');
                privacySwitch.classList.add('edit-text-anim');

            // Otherwise, check each header element for change.
            // If anything changed, flag the new state to be sent for storage in the database.
            } else {

                // Check & update the artist name.
                let artistNameInput = document.getElementById('edit-title-text-input').value;
                if (req.artistName !== artistNameInput) {
                    valuesChanged = true;
                    displayTitle.textContent = artistNameInput;
                    req.artistName = artistNameInput;
                }

                // Check & update the zip code.
                let zipCodeInput = document.getElementById('edit-title-loc-input').value;
                if (req.zipCode !== zipCodeInput) {
                    valuesChanged = true;
                    displayLoc.innerHTML = `<i class="fas fa-map-marker-alt"></i>${zipCodeInput}`;
                    req.zipCode = zipCodeInput;
                }

                // Check & update the privacy setting.
                let privacySwitchState = document.getElementById('privacySwitch').getAttribute('checked') === 'true' ? 1 : 0;
                if (req.privacySwitch !== privacySwitchState) {
                    valuesChanged = true;
                    displayLoc.innerHTML = `<i class="fas fa-map-marker-alt"></i>${zipCodeInput}`;
                    req.privacySwitch = privacySwitchState;
                    // The JS that's in the hanldebars file to switch the privacy paddle display could hypothetically go here, as well.
                }

                // Remove the animations on the way out.
                headerEditBtn.classList.remove('edit-button-animate-in');
                editTitle.classList.remove('edit-text-anim');
                editLoc.classList.remove('edit-text-anim');
                privacySwitch.classList.remove('edit-text-anim');
            }

            // Remove focus from header button because that causes odd issues.
            headerEditBtn.blur();

            // Toggle editing mode.
            isEditingHeader = !isEditingHeader

            // If anything changed, send the request.
            if (valuesChanged) {
                openRequest('header', req);
            }
        });
    }

    function editAbout() {
        // Edit button for about section.
        let aboutBtn = document.getElementById('edit-about');

        // Boolean to determine if we're in edit mode.
        let isEditingAbout = false;

        // The request to build if edits are made. Defaults to current values.
        let req = {
            bio: document.getElementById('edit-about-text-input').value,
        }

        aboutBtn.addEventListener('click', () => {

            // Boolean to determine if anything has changed.
            let valuesChanged = false;

            // Grab the display & edit elements in about.
            let displayBio = document.getElementById('profile-about-text');
            let editBio = document.getElementById('edit-about-text');

            // Toggle the visibility of about elements (switch from 'view' to 'edit').
            displayBio.hidden = !displayBio.hidden;
            editBio.hidden = !editBio.hidden;

            // If the user is about to edit, animate the edit button and edit elements.
            if (!isEditingAbout) {
                aboutBtn.classList.add('edit-button-animate-in');
                editBio.classList.add('edit-text-anim');

            // Otherwise, check if about element changed.
            } else {

                // Check & update the about section.
                let aboutInput = document.getElementById('edit-about-text-input').value;
                if (req.bio !== aboutInput) {
                    valuesChanged = true;
                    displayBio.textContent = aboutInput;
                    req.bio = aboutInput;
                }

                // Remove the animations on the way out.
                aboutBtn.classList.remove('edit-button-animate-in');
                editBio.classList.remove('edit-text-anim');
            }

            // Remove focus from edit button because that causes odd issues.
            aboutBtn.blur();

            // Toggle editing mode.
            isEditingAbout = !isEditingAbout

            // If anything changed, send the request.
            if (valuesChanged) {
                openRequest('about', req);
            }
        });
    }

    function editSocial() {

        // Edit button for social section.
        let socialBtn = document.getElementById('edit-social');

        // Boolean to determine if we're in edit mode.
        let isEditingSocial = false;

        // The request to build if edits are made. Defaults to current values.
        let req = {
            website: document.getElementById('edit-website-text').value,
        }

        socialBtn.addEventListener('click', () => {

            // Boolean to determine if anything has changed.
            let valuesChanged = false;

            // Grab the display & edit elements in social.
            let displaySocial = document.getElementById('profile-social-website-filled');
            let displaySocialEmpty = document.getElementById('profile-social-website-empty');
            let editSocial = document.getElementById('edit-social-website');

            // If the user is about to edit, animate the edit button and edit elements.
            if (!isEditingSocial) {
                // Toggle the visibility of social elements (switch from 'view' to 'edit').
                displaySocial.hidden = true;
                displaySocialEmpty.hidden = true;
                editSocial.hidden = !editSocial.hidden;

                socialBtn.classList.add('edit-button-animate-in');
                editSocial.classList.add('edit-text-anim');

            // Otherwise, check if social element changed.
            } else {

                // Check & update the social section.
                let socialInput = document.getElementById('edit-website-text').value.trim();
                if (req.website !== socialInput) {
                    valuesChanged = true;

                    // If there's something besides whitespace, make a link out of it.
                    if (socialInput !== '') {
                        displaySocial.setAttribute('href', socialInput);
                        displaySocial.innerHTML = `<a id="profile-social-website" href="${socialInput}" target="_blank"><i class="fas fa-globe"></i>${socialInput}</a>`;
                    }

                    req.website = socialInput;
                }

                // Toggle the visibility of social elements based on whether or not its empty.
                displaySocial.hidden = req.website === '' ? true : false;
                displaySocialEmpty.hidden = req.website === '' ? false : true;
                editSocial.hidden = !editSocial.hidden;

                // Remove the animations on the way out.
                socialBtn.classList.remove('edit-button-animate-in');
                editSocial.classList.remove('edit-text-anim');
            }

            // Remove focus from edit button because that causes odd issues.
            socialBtn.blur();

            // Toggle editing mode.
            isEditingSocial = !isEditingSocial

            // If anything changed, send the request.
            if (valuesChanged) {
                openRequest('website', req);
            }
        });
    }

    function editVideo() {

        // Edit button for video section.
        let videoBtn = document.getElementById('edit-video');

        // Boolean to determine if we're in edit mode.
        let isEditingVideo = false;

        let container = document.getElementById('profile-music-container');
        let videos = container.getElementsByTagName('iframe');

        // Builds the current state of videos as keys (SampleKey) and values (SampleLocation)
        let req = {}

        for (let video of videos) {
            req[video.getAttribute('data-id')] = video.getAttribute('src');
        }

        videoBtn.addEventListener('click', () => {

            // Boolean to determine if anything has changed.
            let valuesChanged = false;

            // Grab elements for display & edit.
            let container = document.getElementById('profile-music-container');
            let videos = container.getElementsByTagName('iframe');
            let inputs = container.getElementsByTagName('input');

            // Toggle visibility of elements.
            for (let video of videos) { video.hidden = !video.hidden }
            for (let input of inputs) { input.hidden = !input.hidden }

            // If the user is about to edit, animate the edit button and edit elements.
            if (!isEditingVideo) {

                videoBtn.classList.add('edit-button-animate-in');
                for (let input of inputs) { input.classList.add('edit-text-anim') }

                // Otherwise, check if social element changed.
            } else {
                // TODO: Make the things happen when videos are edited.
            }

            // Remove focus from edit button because that causes odd issues.
            videoBtn.blur();

            // Toggle editing mode.
            isEditingVideo = !isEditingVideo

            // If anything changed, send the request.
            if (valuesChanged) {
                openRequest('videos', req);
            }
        });
    }

    function openRequest(endpoint, payload) {
        console.log('values sent to openRequest: ', endpoint, payload);
        let req = new XMLHttpRequest();
        req.open('PUT', `/profile/${endpoint}`, true);
        req.addEventListener('load', () => {
            if (req.status < 400) {
                console.log("YAAAAS!");
            } else {
                console.log("BAD." + req.statusText);
            }
        });
        req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
        req.send(JSON.stringify(payload));
    }
}


/*
This is how we are going to get track ID from Soundcloud URLs for each track -

document.addEventListener('DOMContentLoaded', (event) => {
    let req = new XMLHttpRequest();
    let url = 'https://soundcloud.com/milklab/nate-kimball-orchestra-namaste';
    req.open('GET', `https://cors-anywhere.herokuapp.com/${url}`, true);
    req.addEventListener('load', () => {
        let res = req.responseText;
        if (req.status < 400) {
            // console.log(res);
            console.log("YAY!");
            let number = res.match(/soundcloud:\/\/sounds:(\d{9})/);
            console.log(number[1]);
            let iframe = `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${number[1]}`;
            console.log(iframe);
        }
    });
    req.send(null);
});
*/

window.addEventListener('DOMContentLoaded', () => {
    let req = new XMLHttpRequest();
    req.open('GET', `/profile/worksamples`, true);
    req.addEventListener('load', () => {
        if (req.status < 400) {
            console.log(req.responseText);
        } else {
            console.log("BAD." + req.statusText);
        }
    });
    req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
    req.send(null);
});


//returns a list of the instruments in the edit form of the passed id
function getEditInstruments() {
    //Go to the edit form for this add and grab all instruments
    let adInstruments = $("#instrument-list").find("li");

    let instrumentList = [];

    //add instruments to array
    adInstruments.each(function () {
        let instID = $(this).find(".inst-list-inst").attr("data-val");
        let levelID = $(this).find(".inst-list-level").attr("data-val");
        let instName = $(this).find(".inst-list-inst").text();
        let levelName = $(this).find(".inst-list-level").text();

        instrumentList.push({
            "InstrumentKey": instID,
            "LevelKey": levelID,
            "Instrument": instName,
            "Level": levelName
        });
    });

    //return list of instruments
    return instrumentList;
}

//populates edit instrument form with current instruments
function populateInstrumentsEditForm() {

    let instruments = getEditInstruments(); //get instrument data from instrument section of profile

    $.each(instruments, function (i, instrument) {
        var sectionID = addSelection(instrument.InstrumentKey, instrument.Instrument, "edit"); //add this instrument to the form
        $("#" + sectionID).find("#level-" + sectionID).val(instrument.LevelKey); //set the level
    });
}

//when passed an instrument id + name, will add a new section under the instrument select so the user can select level or delete.
//will show user an error if they try to add the same instrument twice
function addSelection(id, inst) {
    var selectionDiv = $("#instrument-selection-edit"); //grab section below instrument select

    var thisId = id + "-" + Date.now();

    selectionDiv.append("<div class='instrument-selection-item' id='" + thisId + "'></div>"); //add a new 'box' for this selected instrument

    var thisSelection = selectionDiv.find("#" + thisId);

    thisSelection.append("<div class='delete-selection'>X</div>"); //add the icon to delete this section
    var levelSelect = $("#level-list-main-edit").clone(); //copy the existing level selector so this instrument can have its own
    levelSelect.attr("id", "level-" + thisId); //set the id for the level select + unhide it
    levelSelect.css("display", "inline-block");

    thisSelection.append("<div class='instrument-selection-text'>" + inst + "</div>");
    thisSelection.append(levelSelect);

    return thisId;
}


//returns html for instrument list for instrument section when passed in list of instruments/levels.
function createInstrumentList(instruments) {
    let list = ``;
    for (let i in instruments) {
        list += `<li><span class='inst-list-inst' data-val='${instruments[i]['InstrumentKey']}'>${instruments[i]['Instrument']}</span>
            <span class='inst-list-level' data-val='${instruments[i]['LevelKey']}'>(${instruments[i]['Level']})</span></li>`;
    }
    return list;
}


$(document).ready(function () {

    //set up the instrument to use select2 for easy searching+selecting. This seemed closest to the datalist we were using
    $('#instrument-list-edit').select2({
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

    $("#edit-instruments").click(function () {
        $("#instrument-selection-edit").html(""); //clear out any selected instruments
        $("#error-msg-edit").html(""); //clear out any error msg'
        populateInstrumentsEditForm(); //populate form with this ad info

        $("#modal-edit-instruments").foundation('open'); //show form to user
    });

    //add event on instrument save to put instruments back into main form.
    $("#instrument-section-edit-btn").click(function () {

        var id = $(this).attr("data-id"); //profileID

        $("#error-msg-edit").html(""); //clear out any error msg

        var selectedInstruments = $("#modal-edit-instruments").find(".instrument-selection-item"); //get all selected instruments

        //make sure the user chose at least one
        if (selectedInstruments.length < 1) {
            $("#error-msg-edit").html("Please select at least one instrument");
        }
        else {
            //gather IDs + make sure levels are all selected
            var errorMsg = ""; //this will be non-blank if we find an error
            var selected = [];
            var idlevelcombos = []; //instrument/level combo must be unique so create an array to check

            selectedInstruments.each(function () {
                var instID = $(this).attr("id").split("-")[0]; //get the instrument ID
                var levelID = $(this).find("select.selection-level").val(); //get the levelID
                var instrumentName = $(this).find(".instrument-selection-text").text();
                var levelName = $(this).find("select.selection-level").find("option:selected").text();

                if (levelID < 1) { //this instrument doesnt have a level selected
                    errorMsg = "Please select an experience level for each instrument";
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

                //if no errors, go ahead and send to server to save.
                $.ajax({
                    type: "POST",
                    url: "/profile/instruments",
                    data: {
                        "id": id,
                        "instruments": selected,
                    },
                    success: function (data, textStatus, jqXHR) {
                        $("#modal-edit-instruments").foundation('close'); //close popup

                        //data - response from server
                        if (data.success == 1) {
                            $("#instrument-list").html(createInstrumentList(selected)); //update instrument list on profile
                            $("#modal-edit-instruments").foundation('close'); //close popup
                        }
                        else $("#error-msg-edit").html("Error saving instruments."); //error! show it on the form
                       
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        $("#error-msg-edit").html("Error saving instruments.");
                    },
                    dataType: 'json'
                });
            }
        }
    });
});
