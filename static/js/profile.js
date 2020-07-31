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
                ['profile-head-title-privacy', 'edit-title-privacy-switch', 'privacySwitch', (obj => obj.childNodes[4].checked ? 1 : 0), 'profile-head-title-privacy-value', ['You are currently looking for a spot in a band.', 'You are not currently looking for a spot in a band.']]
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
            items: false
        },
        music: {
            isEditing: false,
            button: 'edit-music',
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


    // document.getElementById('submitForm').addEventListener('click', e => {
}

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