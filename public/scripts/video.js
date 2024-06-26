document.addEventListener('DOMContentLoaded', (event) => {
    const videoPlayer = document.getElementById('videoPlayer');
    const videoCount = 4; // Number of videos
    const randomVideoIndex = Math.floor(Math.random() * videoCount) + 1; // Random number between 1 and 4
    const videoPath = `./assets/videos/${randomVideoIndex}.mp4`;

    videoPlayer.src = videoPath;
    videoPlayer.play();
    videoPlayer.setAttribute('controls', 'false');

    videoPlayer.addEventListener('ended', () => {
        window.location.href = 'home.html'; // Redirect to home.html when the video ends
    });

    // Set video to fullscreen
    videoPlayer.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    });
});
