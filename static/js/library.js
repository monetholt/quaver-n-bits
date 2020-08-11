//place to put functions used on every page.

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

//TBD add fns for notifications

//mark all notifications read
markReadAllNotifications()
{
    $.ajax({
        type: "POST",
        url: "/notifications/markRead",
        data: {},
        success: function (success, textStatus, jqXHR) {
            //data - response from server
            if (success) {
                $("#notifications").find(".match").removeClass("notif-unread").addClass("notif-read");
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

//mark all notifications read
clearAllNotifications()
{
    $.ajax({
        type: "POST",
        url: "/notifications/delete",
        data: {},
        success: function (success, textStatus, jqXHR) {
            //data - response from server
            if (success) {
                $("#notifications").find(".notifications-menu").html("<span>Nothing to see here</span>"); //clear out notifications
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