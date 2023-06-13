class Metronome extends EventTarget {
  audioContext = null;
  beatQueue = []; // notes that have been put into the web audio and may or may not have been played yet {note, time}
  currentBeatInBar = 0;
  currentBar = 0;
  beatsPerBar = 4;
  lookahead = 25; // How frequently to call scheduling function (in milliseconds)
  scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)
  nextNoteTime = 0.0; // when the next note is due
  isRunning = false;
  intervalID = null;
  tempo = 120;
  beatsPlayed = 0
  latencyCompensation = 0.08

  constructor(tempo = 120, beatsPerBar = 4, latencyCompensation) {
    super();

    this.beatsPerBar = beatsPerBar;
    this.tempo = tempo;
    this.latencyCompensation = latencyCompensation || this.latencyCompensation;
  }

  get secondsPerBeat() {
    return 60.0 / this.tempo;
  }

  get currentTime() {
    return this.audioContext.currentTime;
  }

  nextNote() { // Advance current note and time by a quarter note (crotchet if you're posh)

    // Add beat length to last beat time
    this.nextNoteTime += this.secondsPerBeat;

    // Advance the beat number, wrap to zero
    this.currentBeatInBar++;
    this.beatsPlayed++;

    // console.log('this.beatsPlayed', this.beatsPlayed);

    if (this.currentBeatInBar == this.beatsPerBar) {
      this.currentBar++;
      this.currentBeatInBar = 0;
    }
  }

  scheduleNote(beatNumber, time) {
    const osc = this.audioContext.createOscillator();

    const envelope = this.audioContext.createGain();

    // push the note on the queue, even if we're not playing.
    // this.beatQueue.push({
    //   note: beatNumber,
    //   time,
    // });

    this.beatQueue.push({
      bar: this.currentBar,
      beat: this.currentBeatInBar,
      time: this.currentTime,
      nextNote: this.nextNoteTime
    });
    // console.log('[[ scheduleNote INSIDE LOOP ]]', this.beatQueue)

    envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

    osc.frequency.value = (beatNumber % this.beatsPerBar == 0) ? 1000 : 800;

    osc.connect(envelope);

    envelope.connect(this.audioContext.destination);

    osc.start(time);
    osc.stop(time + 0.03);
  }

  scheduler() {
    // while there are notes that will need 
    // to play before the next interval, 
    // schedule them and advance the pointer.

    while (this.nextNoteTime < this.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentBeatInBar, this.nextNoteTime);
      this.nextNote();
    }

    this.dispatchEvent(
      new CustomEvent('metronome:tick', {
        bubbles: true,
        detail: {
          bar: this.currentBar,
          beat: this.currentBeatInBar,
          time: this.currentTime,
          nextNote: this.nextNoteTime
        }
      })
    );

    this.intervalID = setTimeout(this.scheduler.bind(this), this.lookahead);
  }

  start() {
    if (this.isRunning) return;
    this.audioContext = new(window.AudioContext || window.webkitAudioContext)();

    if (this.audioContext == null) {}

    this.isRunning = true;

    this.nextNoteTime = 0.0;
    this.currentBar = 0;
    this.currentBeatInBar = 0;
    this.nextNoteTime = this.currentTime + this.latencyCompensation //0.08;

    this.scheduler();
  }

  stop() {
    this.isRunning = false;

    clearInterval(this.intervalID);

    this.intervalID = null;
  }

  startStop() {
    if (this.isRunning) {
      this.stop();
    }

    else {
      this.start();
    }
  }
}