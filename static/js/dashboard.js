document.addEventListener('DOMContentLoaded', (event) => {
    let req = new XMLHttpRequest();
    req.open('GET', '/dashboard/ads', true);
    req.addEventListener('load', () => {
        let res = JSON.parse(req.responseText);
        console.log(res);
        if (req.status < 400){
            document.getElementById('current-ads-loading').hidden = true;
            document.getElementById('no-current-ads').hidden = false;
            console.log("YAY!");
        } else {
            console.log("WHOOPS!");
        }
    });
    document.getElementById('current-ads-loading').hidden = false;
    document.getElementById('no-current-ads').hidden = true;
    req.send(null);
});

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
