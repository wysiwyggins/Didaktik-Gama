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
    });  // Add keydown event listener for hotkeys
    document.addEventListener('keydown', keyPressed);
});

function keyPressed(event) {
  if (event.key === '}') { 
    window.location.href = 'geomancy.html';
  } else if (event.key === '{') {
    window.location.href = 'automata.html';
  } else if (event.key === 'c') {
    window.location.href = 'cradle.html';
  } else if (event.key === 'v') {
    window.location.href = 'video.html';
  } else if (event.key === 't') {
    window.location.href = 'textovka.html';
  } else if (event.key === 'Escape') {
    if (window.api) {
      window.api.quitApp();
    }
  }
}