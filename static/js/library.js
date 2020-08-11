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