var metronome = new Metronome(120, 4);

window.metronome = metronome

var tempo = document.getElementById('tempo');

tempo.textContent = metronome.tempo;

var playPauseIcon = document.getElementById('play-pause-icon');

var playButton = document.getElementById('play-button');

playButton.addEventListener('click', function() {
  metronome.startStop();

  if (metronome.isRunning) {
    playPauseIcon.className = 'pause';
  }
  else {
    playPauseIcon.className = 'play';
  }
});

var tempoChangeButtons = document.getElementsByClassName('tempo-change');

for (var i = 0; i < tempoChangeButtons.length; i++) {
  tempoChangeButtons[i].addEventListener('click', function() {
    metronome.tempo += parseInt(this.dataset.change);
    tempo.textContent = metronome.tempo;
  });
}

const barDisplay = document.querySelector('#time-display-bars');
const beatDisplay = document.querySelector('#time-display-beats');
const secondsDisplay = document.querySelector('#time-display-seconds');


const beatStepper = document.querySelector('#beat-stepper');
let currentBeatStep = null;
let lastBeat = null;

const updateUI = (state) => {
  const { bar, beat, time, nextNote } = state
  let adjustedTime = time.toFixed(2);

  barDisplay.textContent = bar;
  beatDisplay.textContent = beat;
  secondsDisplay.textContent = adjustedTime // time.toFixed(2);

  if (currentBeatStep instanceof HTMLElement) {
    currentBeatStep.classList.remove('active');
  }

  currentBeatStep = beatStepper.querySelector('#b' + beat);

  currentBeatStep.classList.add('active');
};

const startLoop = () => {
  let beat;
  
  while (metronome.beatQueue.length && metronome.beatQueue[0].time < metronome.currentTime) {
    beat = metronome.beatQueue[0];
    metronome.beatQueue.shift(); // Remove note from queue
  }

  if (beat && lastBeat !== beat) {
    updateUI(beat)
  }
  
  requestAnimationFrame(startLoop)
};


startLoop();