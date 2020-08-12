//place to put functions used on every page.

// generate random gradient background colors (profile, user-profile)
function randomBG() {
    let header = document.getElementsByClassName('profile-header')[0];
    let variance = 40;
    let rand1 = Math.random() * (360 - 0) + 0;
    let rand2 = rand1 - variance < 0 ? rand1 - variance + 360 : rand1 - variance;
    header.style.backgroundImage = `linear-gradient(to bottom right, hsl(${rand1}, 70%, 50%), hsl(${rand2}, 70%, 50%))`;
}

//show alert
// Show an alert with type (either "success" or "warning"). Pass a template string to display that formatted text.
function showAlert(type, icon, text) {
    let alert = document.getElementById('alert-popout');
    alert.innerHTML = `<i class="${icon}"></i>${text}`;
    alert.hidden = false;
    alert.classList.add(type);
    alert.classList.remove('hidden');
    setTimeout(
        function () {
            alert.classList.add('hidden');
            alert.classList.remove(type);
        }, 2500);
}


//returns html of action button put in notification dropdown when passed if notification is read + the id 
function createNotifActionHtml(isRead, id) {
    if (isRead) {
        return '<button onclick="event.stopPropagation(); markUnread(' + id + ')" class="button" type="button" data-click-open="false" data-tooltip tabindex="1" title="Mark as unread." data-position="bottom" data-alignment="center">' +
            '<i class="fas fa-circle"></i>' +
            '</button>';
    }
    else
    {
        return '<button onclick="event.stopPropagation(); markRead(' + id + ')" class="button" type="button" data-click-open="false" data-tooltip tabindex="1" title="Mark as read." data-position="bottom" data-alignment="center">' +
            '<i class="fas fa-dot-circle"></i>' +
            '</button>';
    }
}


//looks to see if we have any unread messages. If so, adds unread icon to nav bar bell. Otherwise removes unread class.
function checkAllRead() {

    var notificationCount = $("#notifications").find(".notif").length; //total number of notifications

    if (notificationCount > 1) //first check to see if we even have any notifs here
    {
        if ($("#notifications").find(".read").length == notificationCount) //if all notifs are read, go ahead an remove the unread icon
        {
            $("#notifications").removeClass("unread"); //No notifications. remove 'unread' icon on bell (if it was there)
        }
        else {
            $("#notifications").addClass("unread"); //There are unread notices. Add that icon to the nav bar bell
        }
    }
    else
    {
        $("#notifications").removeClass("unread"); //No notifications. remove 'unread' icon on bell (if it was there)
        $("#notifications").find(".notifications-body").html("<span>Nothing to see here</span>"); //replace html 
        $("#notifications").find(".notifications-header").html(""); //remove delete/clear all action btns
    }

    $(document).foundation(); //refresh all tooltips
}

//mark all notifications read
function markReadAllNotifications()
{
    $.ajax({
        type: "PUT",
        url: "/notifications/markRead",
        data: {},
        success: function (success, textStatus, jqXHR) {
            //data - response from server
            if (success) { //successfull update

                //get every notification div in the dropdown
                $("#notifications").find(".notif").each(function () {
                    $(this).addClass("read"); //remove 'read' class the notification
                    var thisNotifID = $(this).attr("id").split("-")[2]; //get the ID of this notification

                    var thisNoticeControl = $(this).find(".notif-controls"); // get this notification control section w/btn
                    thisNoticeControl.find("button").foundation('_destroy'); //remove the tooltip
                    thisNoticeControl.html(createNotifActionHtml(true, thisNotifID)); //create new action button for this notification and replace the old one
                });

                checkAllRead(); //update nav bar icon
            }
            else {
                showAlert("warning", "fa fa-exclamation-triangle", "Error clearing notifications."); //something went wrong
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            showAlert("warning", "fa fa-exclamation-triangle", "Error clearing notifications."); //something went wrong
        },
        dataType: 'json'
    });
}

//marks an individual notification as read when passed ID.
function markRead(id) {
    $.ajax({
        type: "PUT",
        url: "/notifications/markRead/" + id,
        data: {},
        success: function (success, textStatus, jqXHR) {
            //data - response from server
            if (success) { //successfull update
                var thisNoticeControl = $("#notif-id-" + id).addClass("read").find(".notif-controls"); // get this notification control section w/btn + add read class

                thisNoticeControl.find("button").foundation('_destroy'); //remove the tooltip
                thisNoticeControl.html(createNotifActionHtml(true, id)); //create new action button for this notification and replace the old one
                checkAllRead(); //update nav bar icon

            }
            else {
                showAlert("warning", "fa fa-exclamation-triangle", "Error clearing notifications."); //something went wrong
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            showAlert("warning", "fa fa-exclamation-triangle", "Error clearing notifications."); //something went wrong
        },
        dataType: 'json'
    });
}


//marks an individual notification as read when passed ID.
function markUnread(id) {
    $.ajax({
        type: "PUT",
        url: "/notifications/markUnread/" + id,
        data: {},
        success: function (success, textStatus, jqXHR) {
            //data - response from server
            if (success) { //successfull update
                var thisNoticeControl = $("#notif-id-" + id).removeClass("read").find(".notif-controls"); // get this notification control section w/btn + remove read class

                thisNoticeControl.find("button").foundation('_destroy'); //remove the tooltip
                thisNoticeControl.html(createNotifActionHtml(false, id)); //create new action button for this notification and replace the old one
                checkAllRead(); //update nav bar icon

            }
            else {
                showAlert("warning", "fa fa-exclamation-triangle", "Error clearing notifications."); //something went wrong
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            showAlert("warning", "fa fa-exclamation-triangle", "Error clearing notifications."); //something went wrong
        },
        dataType: 'json'
    });
}

//delete all notifications. update notif dropdown menu + bell icon
function clearAllNotifications()
{
    $.ajax({
        type: "DELETE",
        url: "/notifications/delete",
        data: {},
        success: function (success, textStatus, jqXHR) {
            //data - response from server
            if (success) {
                $("#notifications").find(".notif-controls").find("button").foundation('_destroy'); //remove the tooltips
                $("#notifications").find(".notifications-body").html(""); //clear out notifications
                checkAllRead(); //update nav bar icon

            }
            else {
                showAlert("warning", "fa fa-exclamation-triangle", "Error clearing notifications."); //something went wrong
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            showAlert("warning", "fa fa-exclamation-triangle", "Error clearing notifications."); //something went wrong
        },
        dataType: 'json'
    });
}