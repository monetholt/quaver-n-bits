//  document.addEventListener('DOMContentLoaded', (event) => {
//     let req = new XMLHttpRequest();
//     req.open('GET', '/dashboard/ads', true);
//     req.addEventListener('load', () => {
//         let res = JSON.parse(req.responseText);
//         if (req.status < 400) {
//             $("[name='sortOrder']").val(res.sort);
//             console.log(res);
//             if (res.has_current_ads) {
//                 document.getElementById('current-ads-loading').hidden = true;
//                 let currentAds = document.getElementById('current-ads');
//                 for (let ad in res.current_ads) {
//                     currentAds.appendChild(createAd(res.current_ads[ad]));
//                     allAds[res.current_ads[ad]['AdKey']] = res.current_ads[ad];
//                 }
//             } else {
//                 document.getElementById('current-ads-loading').hidden = true;
//                 document.getElementById('no-current-ads').hidden = false;
//             }
//
//             if (res.has_prev_ads) {
//                 document.getElementById('previous-ads-loading').hidden = true;
//                 let previousAds = document.getElementById('previous-ads');
//                 for (let ad in res.prev_ads) {
//                     previousAds.appendChild(createAd(res.prev_ads[ad]));
//                     allAds[res.prev_ads[ad]['AdKey']] = res.prev_ads[ad];
//                 }
//             } else {
//                 document.getElementById('previous-ads-loading').hidden = true;
//                 document.getElementById('no-previous-ads').hidden = false;
//             }
//         } else {
//             console.log("WHOOPS!");
//         }
//     });
//     document.getElementById('current-ads-loading').hidden = false;
//     document.getElementById('previous-ads-loading').hidden = false;
//     document.getElementById('no-current-ads').hidden = true;
//     document.getElementById('no-previous-ads').hidden = true;
//     req.send(null);
//  });
//
// }