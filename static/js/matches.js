//removes match from the UI after a reject/block
function removeMatchUI(id) {

    var thisMatch = $("#match-" + id);  //get this match div
    var parentContainer = thisMatch.parent(); //grab the parent container holding matches

    $("#match-" + id).remove(); //remove this match from the list

    if (parentContainer.children().length === 0) { //if we removed all matches from this container
        //show the 'Nothing to see here' msg

        //does it matter if we have incoming-matches-text class on the active empty list?
        parentContainer.append('<div class="incoming-matches-text no-matches-div">'+
            '<h3> Nothing to see here. <i class="fas fa-wind"></i></h3>'+
            '</div>');
    }
}


//Adds match to the connections section after a match accept.
function addMatch2Connections(id) {
    var currentMatch = $("#match-" + id); //get current match element from incoming section

    //grab the photo and name
    var photoUrl = currentMatch.find(".incoming-match-image").find("img").attr("src");
    var matchName = currentMatch.find(".incoming-match-info").find("h4").html();

    removeMatchUI(id); // go and remove that old match now that we got the info we need

    //create our new match html w/action buttons to disconnect or block
    var newHtml = `<div id="match-` + id + `" class="active-match">
                <div class="active-match-image">
                    <img src="`+ photoUrl +`">
                </div>
                <div class="active-match-info">
                        <h4>`+ matchName+`</h4>
                        <h5>Connected just now</h5>
                    </div>
                <div class="active-match-buttons">
                        <button class="button active expanded" onclick="disconnectMatch(`+id+`)"><i class="fas fa-microphone-alt-slash"></i>Disconnect</button>
                        <button class="button warning expanded" onclick="blockMatch(`+ id+`)"><i class="fas fa-hand-middle-finger"></i>Block</button>
                    </div>
                </div>`;

    console.log(newHtml);

    //get ready to add new match to connections
    $(".active-matches-container").find(".no-matches-div").remove(); //but first remove no matches message if its there
    $(".active-matches-container").append(newHtml); //add the new match to the connections
}



//accepts match w/passedID
function acceptMatch(id) {
    //$.ajax({
    //    type: "POST",
    //    url: "/matches/accept/" + id,
    //    data: {},
    //    success: function (success, textStatus, jqXHR) {
    //        //data - response from server
    //        if (success && success.success > 0) { //successfull update

    //            showAlert("success", "far fa-check-circle", "You are now connected!");
    //            addMatch2Connections(id);
    //        }
    //        else {
    //            showAlert("warning", "fa fa-exclamation-triangle", "Error accepting match request."); //something went wrong
    //        }
    //    },
    //    error: function (jqXHR, textStatus, errorThrown) {
    //        showAlert("warning", "fa fa-exclamation-triangle", "Error accepting match request."); //something went wrong
    //    },
    //    dataType: 'json'
    //});

    showAlert("success", "far fa-check-circle", "You are now connected!");
    addMatch2Connections(id);

}

//rejects match w/passedID
function rejectMatch(id) {
    $.ajax({
        type: "POST",
        url: "/matches/reject/" + id,
        data: {},
        success: function (success, textStatus, jqXHR) {
            //data - response from server
            if (success) { //successfull update

                showAlert("success", "far fa-check-circle", "Match request successfully rejected.");
                removeMatchUI(id); //remove Match from UI

            }
            else {
                showAlert("warning", "fa fa-exclamation-triangle", "Error rejecting match request."); //something went wrong
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            showAlert("warning", "fa fa-exclamation-triangle", "Error rejecting match request."); //something went wrong
        },
        dataType: 'json'
    });

    ////TESTING UI ON SUCCESS COMMENT OUT
    //showAlert("success", "far fa-check-circle", "Match request successfully rejected.");
    //removeMatchUI(id); //remove Match from UI
}


//blocks match w/passedID
function blockMatch(id) {
    $.ajax({
        type: "POST",
        url: "/matches/reject/" + id,
        data: {},
        success: function (success, textStatus, jqXHR) {
            //data - response from server
            if (success) { //successfull update

                showAlert("success", "far fa-check-circle", "User successfully blocked.");
                removeMatchUI(id); //remove Match from UI

            }
            else {
                showAlert("warning", "fa fa-exclamation-triangle", "Error blocking connection."); //something went wrong
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            showAlert("warning", "fa fa-exclamation-triangle", "Error blocking connection."); //something went wrong
        },
        dataType: 'json'
    });

    ////TESTING UI ON SUCCESS COMMENT OUT
    //showAlert("success", "far fa-check-circle", "User successfully blocked.");
    //removeMatchUI(id); //remove Match from UI
}


//disconnects match w/passedID
function disconnectMatch(id) {
    $.ajax({
        type: "POST",
        url: "/matches/disconnect/" + id,
        data: {},
        success: function (success, textStatus, jqXHR) {
            //data - response from server
            if (success) { //successfull update

                showAlert("success", "far fa-check-circle", "Connection successfully removed.");
                removeMatchUI(id); //remove Match from UI

            }
            else {
                showAlert("warning", "fa fa-exclamation-triangle", "Error disconnecting match."); //something went wrong
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            showAlert("warning", "fa fa-exclamation-triangle", "Error disconnecting match."); //something went wrong
        },
        dataType: 'json'
    });


    ////TESTING UI ON SUCCESS COMMENT OUT
    //showAlert("success", "far fa-check-circle", "Connection successfully removed.");
    //removeMatchUI(id); //remove Match from UI
}