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
            if (res.ads.length > 0) {
                document.getElementById('current-ads-loading').hidden = true;
                document.getElementById('previous-ads-loading').hidden = true;

                // Create Levels
                let levels = {};
                for (let i=0; i < res.levels.length; i++) {
                    levels[res.levels[i]['LevelKey']] = res.levels[i]['Level'];
                }

                let currentAds = document.getElementById('current-ads');
                let previousAds = document.getElementById('previous-ads');
                for (let ad in res.ads) {
                    if (res.ads[ad]['IsActive'] === 1) {
                        currentAds.appendChild(createAd(res.ads[ad], levels));
                    } else {
                        previousAds.appendChild(createAd(res.ads[ad], levels));
                    }
                }
            } else {
                console.log("No ads here :(");
                document.getElementById('current-ads-loading').hidden = true;
                document.getElementById('previous-ads-loading').hidden = true;
                document.getElementById('no-current-ads').hidden = false;
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

function createAd(thisAd, levels) {
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
                <h5>${thisAd.DatePosted === thisAd.LastUpdated ? "Posted" : "Updated"} ${moment(thisAd.DatePosted).startOf('day').fromNow()}</h5>
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
                    <li><strong>${thisAd.Quantity}</strong> ${levels[thisAd.LevelID]} ${thisAd.Instrument}${thisAd.Quantity === 1 ? "" : "s"}</li>
                </ul>
            </div> 
        </div>
        `;
    return currentAd;
}

function checkSelected() {
    let val = document.getElementById("instruments").value;
    let opts = document.getElementById('instrument-list').childNodes;
    for (let i = 0; i < opts.length; i++) {
        if (opts[i].value === val) {
            addSelection(val);
            break;
        }
    }
}

function addSelection(inst) {
    let selection = document.getElementById("instrument-selection");
    let item = document.createElement('div');
    item.className = 'instrument-selection-item';
    item.id = inst;
    item.innerHTML = `
            <div class="instrument-selection-text">${inst}</div>
            <div class="grid-x">
                <div class="cell medium-7">
                    <select class="selection-level" name="selection-level" id="selection-level-${inst.toLowerCase()}">
                        <option disabled selected value> -- Skill Level -- </option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                        <option value="Master">Master</option>
                    </select>
                </div>
                <div class="cell medium-1"></div>
                <div class="cell medium-4">
                    <input placeholder="Quantity" type="number" class="instrument-selection-quantity" id="instrument-selection-quantity-${inst}" min="1" max="99" />
                </div>
            </div>
            <div class="delete-selection" onclick="remove(this)">X</div>
        `;

    selection.appendChild(item);
}

function remove(item) {
    item.parentNode.remove();
}
