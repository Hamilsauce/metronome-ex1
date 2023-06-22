import { Metronome } from './metronome.js';

const metronome = new Metronome(120, 4);

window.metronome = metronome

const tempo = document.getElementById('tempo');

tempo.textContent = metronome.tempo;

const playPauseIcon = document.getElementById('play-pause-icon');

const playButton = document.getElementById('play-button');

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

for (let i = 0; i < tempoChangeButtons.length; i++) {
  tempoChangeButtons[i].addEventListener('click', function() {
    metronome.tempo += parseInt(this.dataset.change);
    tempo.textContent = metronome.tempo;
  });
}

const barDisplay = document.querySelector('#time-display-bars');
const barBeatDisplay = document.querySelector('#time-display-bar-beat');
const totalBeatsDisplay = document.querySelector('#time-display-total-beats');
const secondsDisplay = document.querySelector('#time-display-seconds');


const beatStepper = document.querySelector('#beat-stepper');
let currentBeatStep = null;
let lastBeat = null;


const updateUI = (state) => {
  const { bar, beat, totalBeats, time, nextNote } = state
  let adjustedTime = time.toFixed(2);

  barDisplay.textContent = bar;
  barBeatDisplay.textContent = beat;
  totalBeatsDisplay.textContent = totalBeats;
  secondsDisplay.textContent = adjustedTime // time.toFixed(2);

  if (currentBeatStep instanceof HTMLElement) {
    currentBeatStep.classList.remove('active');
  }

  currentBeatStep = beatStepper.querySelector('#b' + beat);

  currentBeatStep.classList.add('active');
};

const startLoop = () => {
  let beat;

  while (metronome.scheduledBeats.length && metronome.scheduledBeats[0].time < metronome.currentTime) {
    beat = metronome.scheduledBeats[0];
    metronome.scheduledBeats.shift(); // Remove note from queue
  }

  if (beat && lastBeat !== beat) {
    updateUI(beat)
  }

  requestAnimationFrame(startLoop)
};


startLoop();