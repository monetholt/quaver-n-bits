 document.addEventListener('DOMContentLoaded', (event) => {
     //
     // // Get all existing match IDs
     // let results = document.getElementById('search-results');
     //
     // // If they actually exist, then fetch the matching profiles & instruments.
     // if (results) {
     //
     //     // Grab all of the Profile IDs we need.
     //     let resultIDs = [];
     //     Object.keys(results.children).forEach(key => {
     //         resultIDs.push(results.children[key].getAttribute('data-id'));
     //     });
     //
     //     // Open request to get profiles & profile instruments.
     //     let req = new XMLHttpRequest();
     //     req.open('POST', '/search-results/profiles', true);
     //     req.addEventListener('load', () => {
     //         let res = JSON.parse(req.responseText);
     //         if (req.status < 400) {
     //             console.log("Response from fetch:");
     //             console.log(res);
     //         }
     //     });
     //
     //     console.log("resultIDs to be sent: " + resultIDs);
     //     req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
     //     req.send(JSON.stringify({ resultIDs: resultIDs }));
     // }
 });
