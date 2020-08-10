 document.addEventListener('DOMContentLoaded', (event) => {

     randomBG();


     function randomBG() {
         let header = document.getElementsByClassName('search-result-header');
         Object.values(header).forEach(result => {
             let variance = 40;
             let rand1 = Math.random() * (360 - 200) + 200;
             let rand2 = rand1 - variance < 0 ? rand1 - variance + 360 : rand1 - variance;
             result.style.backgroundImage = `linear-gradient(to bottom right, hsl(${rand1}, 70%, 50%), hsl(${rand2}, 70%, 50%))`;
         });
     };
 });

