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

function createAd(thisAd) {
    let currentAd = document.createElement('div');
    currentAd.id = 'display-ads-ad-' + thisAd.AdKey;
    currentAd.className = 'display-ads-ad';
    currentAd.innerHTML = `
        <div class="display-ads-edit-overlay" hidden>
            <div class="grid-x ads-edit-header">
                <div class="cell medium-12 ads-edit-editing">
                    <div class="ads-edit-editing-text">
                        <i class="far fa-edit"></i>Editing Ad: <strong>${thisAd.Title}</strong>    
                    </div>
                </div>
                <div class="cell medium-6 ads-edit-title">
                    <label for="ads-edit-title-${thisAd.AdKey}">Title:</label>
                    <input type="text" name="ads-edit-title-${thisAd.AdKey}" id="ads-edit-title-${thisAd.AdKey}" value="${thisAd.Title}">
                </div>
                <div class="cell medium-3 ads-edit-radius">
                    <label for="ads-edit-radius-${thisAd.AdKey}">Search Radius:</label>
                    <select name="ads-edit-radius-${thisAd.AdKey}" id="ads-edit-radius-${thisAd.AdKey}">
                        <option value="Any" selected>Any</option>
                        <option value="5">5 Miles</option>
                        <option value="10">10 Miles</option>
                        <option value="25">25 Miles</option>
                        <option value="50">50 Miles</option>
                        <option value="100">100 Miles</option>
                    </select>
                </div>
                <div class="cell medium-3 ads-edit-loc">
                    <label for="ads-edit-loc-${thisAd.AdKey}">Zip Code:</label>
                    <input type="text" name="ads-edit-loc-${thisAd.AdKey}" id="ads-edit-loc-${thisAd.AdKey}" value="${thisAd.ZipCode}">
                </div>
            </div>
            <div class="grid-x ads-edit-body">
                <div class="cell medium-8 ads-edit-description">
                    <label for="ads-edit-description-${thisAd.AdKey}">Description:</label>
                    <textarea id="ads-edit-description-${thisAd.AdKey}" rows="5">${thisAd.Description}</textarea>
                </div>
                <div class="cell medium-4 ads-edit-instruments">
                    <label for="ads-edit-instruments-${thisAd.AdKey}">Instruments:</label>
                    <input type="text" name="ads-edit-instruments-${thisAd.AdKey}" id="ads-edit-instruments-${thisAd.AdKey}" value="${thisAd.Instrument}">
                </div>
            </div>
            <div class="grid-x ads-edit-footer">
                <div class="cell medium-6 ads-edit-save">
                    <button class="button primary large expanded"><i class="fas fa-share"></i>Save Ad</button>
                </div>
                <div class="cell medium-6 ads-edit-cancel">
                    <button class="button alert large expanded"><i class="far fa-window-close"></i>Cancel</button>
                </div>
            </div>
        </div>
        <div class="display-ads-ad-overlay">
            ${thisAd.IsActive === 1 ? 
                '<button class="button primary large"><i class="fas fa-search"></i>View Matches</button>' +
                '<button class="button secondary large"><i class="far fa-edit"></i>Edit Ad</button>' +
                '<button class="button warning large"><i class="fas fa-microphone-alt-slash"></i>Disable Ad</button>':
                '<button class="button secondary large"><i class="fas fa-sync"></i>Enable Ad</button>'
            }
        </div>
        <div class="grid-x display-ads-ad-header">
            <div class="cell medium-6 display-ads-ad-title">
                <h2>${thisAd.Title}</h2>
                <h5>${thisAd.DatePosted === thisAd.LastUpdated ? "Posted" : "Updated"} ${moment(thisAd.DatePosted).fromNow()}</h5>
            </div>
            <div class="cell medium-6 display-ads-ad-loc">
                <div class="display-ads-ad-loc-display">
                    ${thisAd.IsActive === 1 ? '<i class="fas fa-broadcast-tower"></i> Within <strong>' + thisAd.LocationRadius + '</strong> miles of <strong>' + thisAd.ZipCode + '</strong>' : '<i class="fas fa-microphone-alt-slash"></i>This ad is currently <strong>inactive</strong>.'}                            
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

});