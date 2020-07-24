window.addEventListener('DOMContentLoaded', bindButtons);

function bindButtons() {

    let state = {
        header: {
            isEditing: false,
            button: 'edit-header',
            items: [
                ['profile-header-title-text', 'edit-title-text'],
                ['profile-header-title-loc', 'edit-title-loc']
            ]
        },
        about: {
            isEditing: false,
            button: 'edit-about',
            items: [
                ['profile-about-text', 'edit-about-text']
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
    console.log(JSON.stringify(state));
    for (let i=0; i < Object.keys(state).length; i++) {
        let key = state[Object.keys(state)[i]];
        console.log(key);
        document.getElementById(key.button).addEventListener('click', e => {
            if(!key.isEditing) {
                console.log("now we're editing " + key.button + "!");
                for (let j=0; j < key.items.length; j++) {
                    document.getElementById(key[key.items])
                }
            }
            else {
                console.log(key.button + " NOT SO MUCH!");
            }
            key.isEditing = !key.isEditing;
        });
    }
    // document.getElementById('submitForm').addEventListener('click', e => {
}
