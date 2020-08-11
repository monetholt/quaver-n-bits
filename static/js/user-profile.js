window.addEventListener('DOMContentLoaded', () => {
    // Create random gradient BG for profile header.
    randomBG();

    function randomBG() {
        let header = document.getElementsByClassName('profile-header')[0];
        let variance = 40;
        let rand1 = Math.random() * (360 - 0) + 0;
        let rand2 = rand1 - variance < 0 ? rand1 - variance + 360 : rand1 - variance;
        header.style.backgroundImage = `linear-gradient(to bottom right, hsl(${rand1}, 70%, 50%), hsl(${rand2}, 70%, 50%))`;
    }
});