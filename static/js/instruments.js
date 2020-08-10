//returns html for instrument display list when passed array of instruments and true if this is for an ad/false if for profile.
function createInstrumentList(instruments, isAd) {
    let list = ``;
    for (let i in instruments) {
        list += `<li>`;
        if (isAd) {
            list += `<span class='inst-list-quantity' data-val='${instruments[i]['Quantity']}'>${instruments[i]['Quantity']}</span> `;
        }

        list += `<span class='inst-list-level' data-val='${instruments[i]['LevelKey']}'>${instruments[i]['Level']}-Level</span> 
                <span class='inst-list-inst' data-val='${instruments[i]['InstrumentKey']}'><strong>${instruments[i]['Instrument']}</strong></span></li>`;

    }
    return list;
}

//when passed an instrument id + name, will add a new section under the instrument select so the user can select level or delete.
function addSelection(id, inst, addOrEdit, isAd) {
    var selectionDiv = $("#instrument-selection-" + addOrEdit); //grab section below instrument select

    var thisId = id + "-" + Date.now();

    selectionDiv.append("<div class='instrument-selection-item' id='" + thisId + "'></div>"); //add a new 'box' for this selected instrument

    var thisSelection = selectionDiv.find("#" + thisId);

    thisSelection.append("<div class='delete-selection'>X</div>"); //add the icon to delete this section
    var levelSelect = $("#level-list-main-" + addOrEdit).clone(); //copy the existing level selector so this instrument can have its own
    levelSelect.attr("id", "level-" + thisId); //set the id for the level select + unhide it
    levelSelect.css("display", "inline-block");

    thisSelection.append("<div class='instrument-selection-text'>" + inst + "</div>");
    thisSelection.append(levelSelect);

    if (isAd) { //if this is the instrument editor for an ad, ad a quantity input
        thisSelection.append("<input placeholder='Quantity' type='number' class='selection-quantity'  id='quantity-" + thisId + "' value='1' min='1' max='99' />");
    }

    return thisId;
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
        var sectionID = addSelection(instrument.InstrumentKey, instrument.Instrument, "edit", id > 0); //add this instrument to the form
        $("#" + sectionID).find("#level-" + sectionID).val(instrument.LevelKey); //set the level
        if(id > 0) $("#" + sectionID).find("#quantity-" + sectionID).val(instrument.Quantity); //set the quantity
    });
}


//returns a list of the instruments in the edit form of the passed id. If no id is passed then this is for the profile
function getEditInstruments(id) {
    //Go to the edit form and grab all instruments

    let instruments = id > 0 ? $("#display-ads-edit-overlay-" + id).find(".ads-edit-instruments-section").find("li") :
        $("#instrument-list").find("li");


    let instrumentList = [];

    //add instruments to array
    instruments.each(function () {
        let instID = $(this).find(".inst-list-inst").attr("data-val");
        let levelID = $(this).find(".inst-list-level").attr("data-val");
        let quantity = id > 0? $(this).find(".inst-list-quantity").attr("data-val"): 0;
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

$(document).ready(function () {

    //set up the instrument to use select2 for easy searching+selecting. This seemed closest to the datalist we were using
    $('#instrument-list-edit, #instrument-list-add').select2({
        placeholder: "Select an instrument"
    }).on('select2:select', function (e) {
        //whenever we select a new instrument, add it to the section below to select level
        var selectedOption = e.params.data;
        addSelection(selectedOption.id, (selectedOption.text), $(this).attr("id").split("-")[2], $(this).attr("data-ad") > 0);
    });

    //click event to remove selected instruments.
    $("body").on("click", ".delete-selection", function () {
        $(this).parent().remove();
    });

    $("#modal-edit-ad-instruments").on("closed.zf.reveal", function () {
        clearInstrumentsEditForm();
    });
});