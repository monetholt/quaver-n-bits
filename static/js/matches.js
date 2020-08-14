//removes match from the UI after a reject/block
function removeMatchUI(id) {

    var thisMatch = $("#match-" + id);  //get this match div
    var parentContainer = thisMatch.parent(); //grab the parent container holding matches

    $("#match-" + id).remove(); //remove this match from the list

    if (parentContainer.children().length === 0) { //if we removed all matches from this container
        //show the 'Nothing to see here' msg

        //does it matter if we have incoming-matches-text class on the active empty list?
        parentContainer.append('<div class="incoming-matches-text">'+
            '<h3> Nothing to see here. <i class="fas fa-wind"></i></h3>'+
            '</div>');
    }
}


//TODO
//Adds match to the connections section after a match accept.
function addMatch2Connections(id) {

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