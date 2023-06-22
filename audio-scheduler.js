class AudioScheduler extends EventTarget {
  audioContext = null;
  scheduledBeats = []; // notes that have been put into the web audio and may or may not have been played yet {note, time}
  currentBeatInBar = 0;
  currentBar = 0;
  beatsPerBar = 4;
  lookahead = 25; // How frequently to call scheduling function (in milliseconds)
  scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)
  nextBeatTime = 0.0; // when the next note is due
  isRunning = false;
  schedulerID = null;
  tempo = 120;
  beatsPlayed = 0
  latencyCompensation = 0.08

  constructor(tempo = 120, beatsPerBar = 4, latencyCompensation) {
    super();

    this.beatsPerBar = beatsPerBar;
    this.tempo = tempo;
    this.latencyCompensation = latencyCompensation || this.latencyCompensation;
    this.scheduler = this._scheduler.bind(this)
  }

  get secondsPerBeat() {
    return 60.0 / this.tempo;
  }

  get currentTime() {
    return this.audioContext.currentTime;
  }

  advanceBeat() { // Advance current note and time by a quarter note (crotchet if you're posh)

    // Add beat length to last beat time
    this.nextBeatTime += this.secondsPerBeat;

    // Advance the beat number, wrap to zero
    this.currentBeatInBar++;
    this.beatsPlayed++;

    if (this.currentBeatInBar == this.beatsPerBar) {
      this.currentBar++;
      this.currentBeatInBar = 0;
    }
  }

  scheduleNote(beatNumber, time) {
    const osc = this.audioContext.createOscillator();

    const envelope = this.audioContext.createGain();

    // push the note on the queue, even if we're not playing.

    this.scheduledBeats.push({
      bar: this.currentBar,
      beat: this.currentBeatInBar,
      totalBeats: this.beatsPlayed,
      time: this.currentTime,
      nextNote: this.nextBeatTime
    });

    envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

    osc.frequency.value = (beatNumber % this.beatsPerBar == 0) ? 1000 : 800;

    osc.connect(envelope);

    envelope.connect(this.audioContext.destination);

    osc.start(time);
    osc.stop(time + 0.03);
  }

  _scheduler() {
    // while there are notes that will need 
    // to play before the next interval, 
    // schedule them and advance the pointer.

    while (this.nextBeatTime < this.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentBeatInBar, this.nextBeatTime);
      this.advanceBeat();
    }

    this.dispatchEvent(
      new CustomEvent('metronome:tick', {
        bubbles: true,
        detail: {
          bar: this.currentBar,
          beat: this.currentBeatInBar,
          time: this.currentTime,
          nextNote: this.nextBeatTime
        }
      })
    );

    this.schedulerID = setTimeout(this.scheduler, this.lookahead);
  }

  start() {
    if (this.isRunning) return;

    this.audioContext = new AudioContext();


    this.currentBar = 0;
    this.beatsPlayed = 0;
    this.currentBeatInBar = 0;
    this.isRunning = true;

    this.nextBeatTime = this.currentTime + this.latencyCompensation //0.08;

    this.scheduler();
  }

  stop() {
    this.isRunning = false;

    clearTimeout(this.schedulerID);
    
    this.audioContext.suspend();
    
    this.schedulerID = null;
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