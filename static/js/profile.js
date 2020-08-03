window.addEventListener('DOMContentLoaded', bindButtons);

function bindButtons() {

    let state = {
        header: {
            isEditing: false,
            button: 'edit-header',
            endpoint: 'header',
            req: {
                zipCode: "",
                artistName: "",
                privacySwitch: ""
            },
            items: [
                ['profile-header-title-text', 'edit-title-text', 'artistName', false],
                ['profile-header-title-loc', 'edit-title-loc', 'zipCode', false],
                ['profile-head-title-privacy', 'edit-title-privacy-switch', 'privacySwitch', (() => document.getElementById('privacySwitch').getAttribute('checked') === 'true' ? 1 : 0), 'profile-head-title-privacy-value', ['You are currently looking for a spot in a band.', 'You are not currently looking for a spot in a band.']]
            ]
        },
        about: {
            isEditing: false,
            button: 'edit-about',
            endpoint: 'about',
            req: {
                bio: ""
            },
            items: [
                ['profile-about-text', 'edit-about-text', 'bio', false]
            ]
        },
        social: {
            isEditing: false,
            button: 'edit-social',
            items: [
                ['profile-social-website', 'edit-website-text']
            ]
        },
        instruments: {
            isEditing: false,
            button: 'edit-instruments',
            items: false
        },
        video: {
            isEditing: false,
            button: 'edit-video',
            endpoint: 'worksamples/video', //post for insert, put for update
            items: false
        },
        music: {
            isEditing: false,
            button: 'edit-music',
            endpoint: 'worksamples/music', //post for insert, put for update
            items: false
        }
    }

    // Create event listeners for edit buttons:
    for (let i=0; i < Object.keys(state).length; i++) {
        let key = state[Object.keys(state)[i]];
        let button = document.getElementById(key.button);

        button.addEventListener('click', e => {

            let valuesChanged = false;

            for (let j=0; j < key.items.length; j++) {
                displayText = document.getElementById(key.items[j][0]);
                editObj = document.getElementById(key.items[j][1]);
                displayText.hidden = !displayText.hidden;
                editObj.hidden = !editObj.hidden;
                editObjValue = key.items[j][3] === false ? editObj.lastElementChild.value : key.items[j][3](editObj);
                compareTo = key.items[j].length >= 5 ? document.getElementById(key.items[j][4]).value : displayText.textContent;

                if(!key.isEditing) {
                    button.classList.add('edit-button-animate-in');
                    editObj.classList.add('edit-text-anim');
                } else {
                    key.req[key.items[j][2]] = editObjValue;
                    if (compareTo !== editObjValue) {
                        valuesChanged = true;
                        compareTo = editObjValue;
                        if(key.items[j].length >= 6) {
                            displayText.textContent = editObjValue === 1 ? key.items[j][5][0] : key.items[j][5][1];
                        }
                    }
                    button.classList.remove('edit-button-animate-in');
                    editObj.classList.remove('edit-text-anim');
                }

                button.blur();
            }

            key.isEditing = !key.isEditing;

            if (valuesChanged) {
                console.log("SOMETHING CHANGED - ALERT THE DATABASE! " + JSON.stringify(key.req));
                openRequest(key.endpoint, key.req);
            }
        });

        function openRequest(endpoint, payload) {
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

    function handleText() {

    }

    // document.getElementById('submitForm').addEventListener('click', e => {
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
