window.addEventListener('DOMContentLoaded', bindButtons);

function bindButtons() {

    // Bind each edit button function when the DOM is loaded.
    editHeader();
    editAbout();
    editSocial();
    editVideo();
    editMusic();

    function editHeader() {

        // Edit button for header content.
        let headerEditBtn = document.getElementById('edit-header');

        // Boolean to determine if we're in edit mode on the header.
        let isEditingHeader = false;

        // The request to build if edits are made. Defaults to current values.
        let req = {
            zipCode: document.getElementById('edit-title-loc-input').value,
            artistName: document.getElementById('edit-title-text-input').value,
            privacySwitch: document.getElementById('privacySwitch').getAttribute('checked') === 'true' ? 1 : 0
        }

        headerEditBtn.addEventListener('click', () => {

            // Boolean to determine if anything has changed.
            let valuesChanged = false;

            // Grab all of the viewable elements in the header
            let displayTitle = document.getElementById('profile-header-title-text');
            let displayLoc = document.getElementById('profile-header-title-loc');
            let displayPrivacy = document.getElementById('profile-head-title-privacy');
            let joinedDate = document.getElementById('profile-header-joined-date');

            // Grab all of the editable elements in the header
            let editTitle = document.getElementById('edit-title-text');
            let editLoc = document.getElementById('edit-title-loc');
            let privacySwitch = document.getElementById('edit-title-privacy-switch');

            // Toggle the visibility of all header elements (switch from 'view' to 'edit').
            displayTitle.hidden = !displayTitle.hidden;
            displayLoc.hidden = !displayLoc.hidden;
            displayPrivacy.hidden = !displayPrivacy.hidden;
            joinedDate.hidden = !joinedDate.hidden;
            editTitle.hidden = !editTitle.hidden;
            editLoc.hidden = !editLoc.hidden;
            privacySwitch.hidden = !privacySwitch.hidden;

            // If the user is about to edit, animate the edit button and edit elements.
            if (!isEditingHeader) {
                headerEditBtn.classList.add('edit-button-animate-in');
                editTitle.classList.add('edit-text-anim');
                editLoc.classList.add('edit-text-anim');
                privacySwitch.classList.add('edit-text-anim');

            // Otherwise, check each header element for change.
            // If anything changed, flag the new state to be sent for storage in the database.
            } else {

                // Check & update the artist name.
                let artistNameInput = document.getElementById('edit-title-text-input').value;
                if (req.artistName !== artistNameInput) {
                    valuesChanged = true;
                    displayTitle.textContent = artistNameInput;
                    req.artistName = artistNameInput;
                }

                // Check & update the zip code.
                let zipCodeInput = document.getElementById('edit-title-loc-input').value;
                if (req.zipCode !== zipCodeInput) {
                    valuesChanged = true;
                    displayLoc.innerHTML = `<i class="fas fa-map-marker-alt"></i>${zipCodeInput}`;
                    req.zipCode = zipCodeInput;
                }

                // Check & update the privacy setting.
                let privacySwitchState = document.getElementById('privacySwitch').getAttribute('checked') === 'true' ? 1 : 0;
                if (req.privacySwitch !== privacySwitchState) {
                    valuesChanged = true;
                    displayLoc.innerHTML = `<i class="fas fa-map-marker-alt"></i>${zipCodeInput}`;
                    req.privacySwitch = privacySwitchState;
                    // The JS that's in the hanldebars file to switch the privacy paddle display could hypothetically go here, as well.
                }

                // Remove the animations on the way out.
                headerEditBtn.classList.remove('edit-button-animate-in');
                editTitle.classList.remove('edit-text-anim');
                editLoc.classList.remove('edit-text-anim');
                privacySwitch.classList.remove('edit-text-anim');
            }

            // Remove focus from header button because that causes odd issues.
            headerEditBtn.blur();

            // Toggle editing mode.
            isEditingHeader = !isEditingHeader

            // If anything changed, send the request.
            if (valuesChanged) {
                openRequest('header', req);
            }
        });
    }

    function editAbout() {
        // Edit button for about section.
        let aboutBtn = document.getElementById('edit-about');

        // Boolean to determine if we're in edit mode.
        let isEditingAbout = false;

        // The request to build if edits are made. Defaults to current values.
        let req = {
            bio: document.getElementById('edit-about-text-input').value,
        }

        aboutBtn.addEventListener('click', () => {

            // Boolean to determine if anything has changed.
            let valuesChanged = false;

            // Grab the display & edit elements in about.
            let displayBio = document.getElementById('profile-about-text');
            let editBio = document.getElementById('edit-about-text');

            // Toggle the visibility of about elements (switch from 'view' to 'edit').
            displayBio.hidden = !displayBio.hidden;
            editBio.hidden = !editBio.hidden;

            // If the user is about to edit, animate the edit button and edit elements.
            if (!isEditingAbout) {
                aboutBtn.classList.add('edit-button-animate-in');
                editBio.classList.add('edit-text-anim');

            // Otherwise, check if about element changed.
            } else {

                // Check & update the about section.
                let aboutInput = document.getElementById('edit-about-text-input').value;
                if (req.bio !== aboutInput) {
                    valuesChanged = true;
                    displayBio.textContent = aboutInput;
                    req.bio = aboutInput;
                }

                // Remove the animations on the way out.
                aboutBtn.classList.remove('edit-button-animate-in');
                editBio.classList.remove('edit-text-anim');
            }

            // Remove focus from edit button because that causes odd issues.
            aboutBtn.blur();

            // Toggle editing mode.
            isEditingAbout = !isEditingAbout

            // If anything changed, send the request.
            if (valuesChanged) {
                openRequest('about', req);
            }
        });
    }

    function editSocial() {

        // Edit button for social section.
        let socialBtn = document.getElementById('edit-social');

        // Boolean to determine if we're in edit mode.
        let isEditingSocial = false;

        // The request to build if edits are made. Defaults to current values.
        let req = {
            website: document.getElementById('edit-website-text').value,
        }

        socialBtn.addEventListener('click', () => {

            // Boolean to determine if anything has changed.
            let valuesChanged = false;

            // Grab the display & edit elements in social.
            let displaySocial = document.getElementById('profile-social-website-filled');
            let displaySocialEmpty = document.getElementById('profile-social-website-empty');
            let editSocial = document.getElementById('edit-social-website');

            // If the user is about to edit, animate the edit button and edit elements.
            if (!isEditingSocial) {
                // Toggle the visibility of social elements (switch from 'view' to 'edit').
                displaySocial.hidden = true;
                displaySocialEmpty.hidden = true;
                editSocial.hidden = !editSocial.hidden;

                socialBtn.classList.add('edit-button-animate-in');
                editSocial.classList.add('edit-text-anim');

            // Otherwise, check if social element changed.
            } else {

                // Check & update the social section.
                let socialInput = document.getElementById('edit-website-text').value.trim();
                if (req.website !== socialInput) {
                    valuesChanged = true;

                    // If there's something besides whitespace, make a link out of it.
                    if (socialInput !== '') {
                        displaySocial.setAttribute('href', socialInput);
                        displaySocial.innerHTML = `<a id="profile-social-website" href="${socialInput}" target="_blank"><i class="fas fa-globe"></i>${socialInput}</a>`;
                    }

                    req.website = socialInput;
                }

                // Toggle the visibility of social elements based on whether or not its empty.
                displaySocial.hidden = req.website === '' ? true : false;
                displaySocialEmpty.hidden = req.website === '' ? false : true;
                editSocial.hidden = !editSocial.hidden;

                // Remove the animations on the way out.
                socialBtn.classList.remove('edit-button-animate-in');
                editSocial.classList.remove('edit-text-anim');
            }

            // Remove focus from edit button because that causes odd issues.
            socialBtn.blur();

            // Toggle editing mode.
            isEditingSocial = !isEditingSocial

            // If anything changed, send the request.
            if (valuesChanged) {
                openRequest('website', req);
            }
        });
    }

    function editVideo() {

        // Edit button for video section.
        let videoBtn = document.getElementById('edit-video');

        // Boolean to determine if we're in edit mode.
        let isEditingVideo = false;

        let container = document.getElementById('profile-video-container');
        let videos = container.getElementsByClassName('display-video-element');

        // Builds the current state of videos as keys (SampleKey) and values (SampleLocation)
        let req = {}

        // Loop through the actual video iframes and build a reference to them, with SampleKey as ID and link as value.
        for (let i=0; i < videos.length; i++) {
            let video = videos[i].getElementsByTagName('iframe')[0];
            req[video.getAttribute('data-id')] = video.getAttribute('src');
        }


        videoBtn.addEventListener('click', () => {

            // Boolean to determine if anything has changed.
            let valuesChanged = false;

            // Grab elements for display & edit.
            let container = document.getElementById('profile-video-container');
            let videos = container.getElementsByClassName('display-video-element');
            let inputs = container.getElementsByClassName('edit-video-element');

            // Display for if there are no videos.
            let noVideos = document.getElementById('no-videos');

            // Grab div for attaching new videos.
            let addVideo = document.getElementById('add-videos-text');

            // Toggle visibility of elements.
            // for (let video of videos) { video.hidden = !video.hidden }

            addVideo.hidden = !addVideo.hidden;

            // If the user is about to edit, animate the edit button and edit elements.
            if (!isEditingVideo) {

                videoBtn.classList.add('edit-button-animate-in');
                for (let input of inputs) {
                    input.classList.add('edit-text-anim');
                    input.classList.remove('hide');
                }
                addVideo.classList.add('edit-text-anim');
                noVideos.hidden = true;

                // Otherwise, check if social element changed.
            } else {
                // TODO: Make the things happen when videos are edited.

                videoBtn.classList.remove('edit-button-animate-in');
                for (let input of inputs) {
                    input.classList.remove('edit-text-anim');
                    input.classList.add('hide');
                }
                addVideo.classList.remove('edit-text-anim');
                noVideos.hidden = videos.length > 0 ? true : false;
            }

            // Remove focus from edit button because that causes odd issues.
            videoBtn.blur();

            // Toggle editing mode.
            isEditingVideo = !isEditingVideo

            // If anything changed, send the request.
            if (valuesChanged) {
                openRequest('videos', req);
            }
        });
    }

    function editMusic() {

        // Edit button for music section.
        let musicBtn = document.getElementById('edit-music');

        // Boolean to determine if we're in edit mode.
        let isEditingMusic = false;

        let container = document.getElementById('profile-music-container');
        let music = container.getElementsByClassName('display-music-element');

        // Builds the current state of tracks as keys (SampleKey) and values (SampleLocation)
        let req = {}

        // Loop through the actual track iframes and build a reference to them, with SampleKey as ID and link as value.
        for (let i=0; i < music.length; i++) {
            let track = music[i].getElementsByTagName('iframe')[0];
            req[track.getAttribute('data-id')] = track.getAttribute('src');
        }


        musicBtn.addEventListener('click', () => {

            // Boolean to determine if anything has changed.
            let valuesChanged = false;

            // Grab elements for display & edit.
            let container = document.getElementById('profile-music-container');
            let videos = container.getElementsByClassName('display-music-element');
            let inputs = container.getElementsByClassName('edit-music-element');

            // Display for if there are no tracks.
            let noMusic = document.getElementById('no-music');

            // Grab div for attaching new music.
            let addMusic = document.getElementById('add-tracks-text');

            // Toggle visibility of elements.
            addMusic.hidden = !addMusic.hidden;

            // If the user is about to edit, animate the edit button and edit elements.
            if (!isEditingMusic) {

                musicBtn.classList.add('edit-button-animate-in');
                for (let input of inputs) {
                    input.classList.add('edit-text-anim');
                    input.classList.remove('hide');
                }
                addMusic.classList.add('edit-text-anim');
                noMusic.hidden = true;

            } else {

                musicBtn.classList.remove('edit-button-animate-in');
                for (let input of inputs) {
                    input.classList.remove('edit-text-anim');
                    input.classList.add('hide');
                }
                addMusic.classList.remove('edit-text-anim');
                noMusic.hidden = videos.length > 0 ? true : false;
            }

            // Remove focus from edit button because that causes odd issues.
            musicBtn.blur();

            // Toggle editing mode.
            isEditingMusic = !isEditingMusic

            // If anything changed, send the request.
            if (valuesChanged) {
                openRequest('music', req);
            }
        });
    }

    function openRequest(endpoint, payload) {
        console.log('values sent to openRequest: ', endpoint, payload);
        let req = new XMLHttpRequest();
        req.open('PUT', `/profile/${endpoint}`, true);
        req.addEventListener('load', () => {
            if (req.status < 400) {
                console.log("DONE!");
            } else {
                console.log("BAD." + req.statusText);
            }
        });
        req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
        req.send(JSON.stringify(payload));
    }
}

let youTubeLinkWasConverted = false;
let convertedYouTubeLink = '';

// Performs final validation check on the video URL, then sends it off to save to the DB while updating the UI.
function addVideo() {
    // Get the URL to be added to the work samples.
    let url = document.getElementById('add-video-text').value;

    // If we got it and it's valid, open a request and store it.
    if (url && validateYouTubeUrl(url)) {
        let req = new XMLHttpRequest();
        req.open('POST', `/profile/worksamples/video`, true);
        req.addEventListener('load', () => {
            if (req.status < 400) {
                showAlert("success", "far fa-check-circle", `Your video has been added! Refreshing the page.`);
                document.getElementById('edit-video').click();
                setTimeout(() => { location.reload(); }, 3000);
            } else {
                showAlert("alert", "fas fa-exclamation-triangle", `Something went wrong trying to add the video. Please try again later.`)
            }
        });
        req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
        req.send(JSON.stringify({ workSampleTextInput: url }));
    } else {
        showAlert("caution", "fas fa-exclamation-triangle", 'You entered an invalid URL. Make sure the URL is from YouTube.');
    }
}

// Deletes the video with the given SampleKey, if it exists. Otherwise, shows an error.
function deleteVideo(referrer=0) {
    if (referrer > 0) {
        let req = new XMLHttpRequest();
        req.open('DELETE', `/profile/worksamples/video`, true);
        req.addEventListener('load', () => {
            if (req.status < 400) {
                showAlert("success", "far fa-check-circle", `Your video was successfully deleted. Refreshing Page.`);
                document.getElementById('edit-video').click();
                setTimeout(() => {
                    location.reload();
                }, 2500);
            } else {
                showAlert("alert", "fas fa-exclamation-triangle", `Something went wrong trying to delete the video. Please try again later.`)
            }
        });
        req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
        req.send(JSON.stringify({sampleKey: referrer}));
    } else {
        showAlert("caution", "fas fa-exclamation-triangle", 'An invalid delete button was pressed. Try refreshing the page.');
    }
}

// Replaces the existing video with given SampleKey with the validated user-provided URL.
function updateVideo(id) {
    // Get the URL to be added to the work samples.
    let url = document.getElementById(`edit-video-text-${id}`).value;

    // If we got it and it's valid, open a request and store it.
    if (url && validateYouTubeUrl(url)) {
        let req = new XMLHttpRequest();
        req.open('PUT', `/profile/worksamples/video`, true);
        req.addEventListener('load', () => {
            if (req.status < 400) {
                showAlert("success", "far fa-check-circle", `Your video has been edited! Refreshing the page.`);
                document.getElementById('edit-video').click();
                setTimeout(() => {
                    location.reload();
                }, 2500);
            } else {
                showAlert("alert", "fas fa-exclamation-triangle", `Something went wrong trying to add the video. Please try again later.`)
            }
        });
        req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
        req.send(JSON.stringify({ workSampleTextInput: url, id: id }));
    } else {
        showAlert("caution", "fas fa-exclamation-triangle", 'You entered an invalid URL. Make sure the URL is from YouTube.');
    }
}


//passed as a callback after the url is converted to a valid soundcloud embed url. Sends data to server via ajax
function addMusic_ajax(url)
{
    let req = new XMLHttpRequest();
    req.open('POST', `/profile/worksamples/music`, true);
    req.addEventListener('load', () => {
        if (req.status < 400) {
            showAlert("success", "far fa-check-circle", `Your track has been added! Refreshing the page.`);
            document.getElementById('edit-music').click();
            setTimeout(() => { location.reload(); }, 3000);
        } else {
            showAlert("alert", "fas fa-exclamation-triangle", `Something went wrong trying to add the track. Please try again later.`)
        }
    });
    req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
    req.send(JSON.stringify({ workSampleTextInput: url }));
}

// Performs final validation check on the track URL, then sends it off to save to the DB while updating the UI.
function addMusic() {
    // Get the URL to be added to the work samples entered by user
    let url = document.getElementById('add-music-text').value;

    // If we got it
    if (url) {
        validateSoundCloudUrl(url, addMusic_ajax); //validate/convert it and pass callback to send data to server.

    } else {
        showAlert("caution", "fas fa-exclamation-triangle", 'You entered an invalid URL. Make sure the URL is a SoundCloud track.');
    }
}

// Deletes the track with the given SampleKey, if it exists. Otherwise, shows an error.
function deleteMusic(referrer=0) {
    if (referrer > 0) {
        let req = new XMLHttpRequest();
        req.open('DELETE', `/profile/worksamples/music`, true);
        req.addEventListener('load', () => {
            if (req.status < 400) {
                showAlert("success", "far fa-check-circle", `Your track was successfully deleted. Refreshing Page.`);
                document.getElementById('edit-music').click();
                setTimeout(() => {
                    location.reload();
                }, 2500);
            } else {
                showAlert("alert", "fas fa-exclamation-triangle", `Something went wrong trying to delete the track. Please try again later.`)
            }
        });
        req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
        req.send(JSON.stringify({sampleKey: referrer}));
    } else {
        showAlert("caution", "fas fa-exclamation-triangle", 'An invalid delete button was pressed. Try refreshing the page.');
    }
}


//passed as a callback after the url is converted to a valid soundcloud embed url. Sends data to server via ajax
function updateMusic_ajax(url, id) {
    let req = new XMLHttpRequest();
    req.open('PUT', `/profile/worksamples/music`, true);
    req.addEventListener('load', () => {
        if (req.status < 400) {
            showAlert("success", "far fa-check-circle", `Your music has been edited! Refreshing the page.`);
            document.getElementById('edit-music').click();
            setTimeout(() => {
                location.reload();
            }, 2500);
        } else {
            showAlert("alert", "fas fa-exclamation-triangle", `Something went wrong trying to edit the track. Please try again later.`)
        }
    });
    req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
    req.send(JSON.stringify({ workSampleTextInput: url, id: id }));
}

// Replaces the existing track with given SampleKey with the validated user-provided URL.
function updateMusic(id) {
    // Get the URL to be added to the work samples entered by user
    let url = document.getElementById(`edit-music-text-${id}`).value;

    // If we got it 
    if (url) {
        validateSoundCloudUrl(url, updateMusic_ajax, id); //validate/convert it and pass callback to send data to server.
    } else {
        showAlert("caution", "fas fa-exclamation-triangle", 'You entered an invalid URL. Make sure the URL is from a SoundCloud track.');
    }
}

function showAlert(type, icon, text) {
    let alert = document.getElementById('alert-popout');
    alert.innerHTML = `<i class="${icon}"></i>${text}`;
    alert.hidden = false;
    alert.classList.add(type);
    alert.classList.remove('hidden');
    setTimeout(
        function() {
            alert.classList.add('hidden');
            alert.classList.remove(type);
        }, 2500);
}

// Copied over & edited from create-profile.
function validateYouTubeUrl(url, referrer=false) {
    // If we already validated & converted this URL and it didn't change, we're good.
    if (youTubeLinkWasConverted && convertedYouTubeLink === url) {
        return true;
    }

    if (url != undefined || url != '' || !youTubeLinkWasConverted) {
        var regExp = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/;
        var match = url.match(regExp);

        if (match && match[1].length == 11) {
            // Do anything for being valid
            document.getElementById(`worksample-youtube-converted${referrer ? '-' + referrer : ''}`).hidden = false;
            document.getElementById(`worksample-youtube-invalid${referrer ? '-' + referrer : ''}`).hidden = true;
            document.getElementById(`${referrer ? 'edit-video-text-' + referrer : 'add-video-text'}`).value = 'https://www.youtube.com/embed/' + match[1] + '?autoplay=0';

            // if need to change the url to embed url then use below line
            //$('#ytplayerSide').attr('src', 'https://www.youtube.com/embed/' + match[2] + '?autoplay=0');

            // Flag that this URL's value and that it was converted.
            youTubeLinkWasConverted = true;
            convertedYouTubeLink = 'https://www.youtube.com/embed/' + match[1] + '?autoplay=0';

            return true;
        }
        else {
            document.getElementById(`worksample-youtube-converted${referrer ? '-' + referrer : ''}`).hidden = true;
            document.getElementById(`worksample-youtube-invalid${referrer ? '-' + referrer : ''}`).hidden = false;
            return false;
        }

    } else return false;
}

// Copied over & edited from create-profile.
function validateSoundCloudUrl(url, callback, referrer=false) {


    // if passed url is non blank try to validate/convert it
    if (url != undefined && url != '') {
        var regExp = /^(https?:\/\/)?(www\.)?(soundcloud\.com|snd\.sc)\/.*$/;
        var match = url.match(regExp);
        if (match) {
            // If this a valid SoundCloud track link, then show user we're converting the link.
            document.getElementById(`worksample-soundcloud-converting${referrer ? '-' + referrer : ''}`).hidden = false;
            document.getElementById(`worksample-soundcloud-invalid${referrer ? '-' + referrer : ''}`).hidden = true;

            // Since it's from SoundCloud, grab the track ID and format it for embedding.
            // Use our super secret CORS escape hatch to make the request since we're 1337 h4x0R2.
            let req = new XMLHttpRequest();
            req.open('GET', `https://cors-anywhere.herokuapp.com/${url}`, true);
            req.addEventListener('load', () => {
                let res = req.responseText;
                if (req.status < 400) {

                    // If we got something back, look for the track ID and construct an embedded link from it.
                    let number = res.match(/soundcloud:\/\/sounds:(\d{9})/);

                    // Hide the loading check.
                    document.getElementById(`worksample-soundcloud-converting${referrer ? '-' + referrer : ''}`).hidden = true;

                    // If a valid ID was found, let the user know and convert the URL for display.
                    if (number && 1 in number) {
                        let iframe = `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${number[1]}`;

                        // Show the user we've finished our conversion and insert it into the worksample input.
                        document.getElementById(`${referrer ? 'edit-music-text-' + referrer : 'add-music-text'}`).value = iframe;

                        // Flag that this URL's value and that it was converted.
                        callback(iframe, referrer);
                    }

                    document.getElementById(`worksample-soundcloud-invalid${referrer ? '-' + referrer : ''}`).hidden = false;
                    showAlert("caution", "fas fa-exclamation-triangle", 'You entered an invalid URL. Make sure the URL is a SoundCloud track.');


                } else {
                    showAlert("caution", "fas fa-exclamation-triangle", 'You entered an invalid URL. Make sure the URL is a SoundCloud track.');
                }
            });
            req.send(null);
        }
        else showAlert("caution", "fas fa-exclamation-triangle", 'You entered an invalid URL. Make sure the URL is a SoundCloud track.');


    } else showAlert("caution", "fas fa-exclamation-triangle", 'You entered an invalid URL. Make sure the URL is a SoundCloud track.');

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


$(document).ready(function () {

    $("#edit-instruments").click(function () {
        $("#instrument-selection-edit").html(""); //clear out any selected instruments
        $("#error-msg-edit").html(""); //clear out any error msg'
        populateInstrumentsEditForm(0); //populate form with this profile's info

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
                            $("#instrument-list").html(createInstrumentList(selected, false)); //update instrument list on profile
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
