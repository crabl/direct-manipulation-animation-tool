const scaleFactor = window.devicePixelRatio;

const canvas: HTMLCanvasElement = document.querySelector('canvas');

const width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
const height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 100; // accomodate scrubber

canvas.width = width * scaleFactor;
canvas.height = height * scaleFactor;
canvas.style.width = width + 'px';
canvas.style.height = height + 'px';

const context = canvas.getContext('2d');

let touches: any = [];

class Scrubber {
  private _isPlaying = false;
  private _playToggle: HTMLDivElement;
  private _scrubber: HTMLDivElement;
  private _currentFrame = 0;
  private _totalFrames = 240; // 10 seconds @ 24FPS
  private _FPS = 24;

  constructor() {
    // TODO: this should instantiate all DOM elements as well
    this._playToggle = document.querySelector('.play-toggle');
    this._playToggle.onclick = (e) => {
      if (this._isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    }

    this._scrubber = document.querySelector('.scrubber');
    this._scrubber.addEventListener('touchstart', () => this.pause());

    this._scrubber.addEventListener('touchmove', (e) => {
      this.pause();
      this.setFrameTo(this._scrubber.scrollLeft / 10);
    });

    this._scrubber.addEventListener('scroll', () => {
      this.setFrameTo(this._scrubber.scrollLeft / 10);
    });
  }

  private setFrameTo(desiredFrame: number) {
    this._currentFrame = Math.min(Math.max(0, Math.ceil(desiredFrame)), this._totalFrames);
  }

  incrementFrame() {
    const desiredFrame = this.getCurrentFrame() + 1;
    if (desiredFrame === 0 || desiredFrame === this._totalFrames) {
      this.pause();
    } else {
      this._currentFrame = desiredFrame;
      this._scrubber.scrollLeft = this._currentFrame * 10;
    }
  }

  pause() {
    this._isPlaying = false;
    this._playToggle.style.background = 'white';
  }

  play() {
    if (this._currentFrame <= this._totalFrames) {
      this._isPlaying = true;
      this._playToggle.style.background = 'green';
    }
  }

  getCurrentFrame() {
    return Math.min(Math.max(0, this._currentFrame), this._totalFrames);
  }

  getFPS() {
    return this._FPS;
  }

  isPlaying() {
    return this._isPlaying;
  }
}

const scrubber = new Scrubber();

const canvasOffsetLeft = canvas.offsetLeft;
const canvasOffsetTop = canvas.offsetTop;

// TODO: remove this because we only use it for debugging frame number
const playToggle: HTMLDivElement = document.querySelector('.play-toggle');

let allFrames = [];
for (let i = 0; i <= 240; i++) {
  allFrames.push([{
    x: 200,
    y: 200
  }, {
    x: 500,
    y: 200
  }{
    x: 800,
    y: 200
  }]);
}

setInterval(() => {
  if (scrubber.isPlaying()) {
    scrubber.incrementFrame();
  }

  playToggle.innerHTML = scrubber.getCurrentFrame().toString(); // this is fking dirty
}, 1000 / scrubber.getFPS());


canvas.addEventListener('touchend', function (event) {
  event.preventDefault();
  touches = event.touches;
});

canvas.addEventListener('touchmove', function (event) {
  touches = event.touches;
});

canvas.addEventListener('touchstart', function (event) {
  event.preventDefault();
  touches = event.touches;
});

// render loop: make this a class pls
(function renderCanvas() {
  context.clearRect(0, 0, width * scaleFactor, height * scaleFactor);

  // draw subjects
  const subjects = allFrames[scrubber.getCurrentFrame()];
  if (subjects) {
    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];
      const subjectX = subject.x * scaleFactor;
      const subjectY = subject.y * scaleFactor;
      const subjectR = 100;

      // draw touches
      for (let j = 0; j < touches.length; j++) {
        const touch = touches[j];

        const touchX = (touch.pageX - canvas.offsetLeft) * scaleFactor;
        const touchY = (touch.pageY - canvas.offsetTop) * scaleFactor;
        const touchR = 50;

        const dist = Math.pow(subjectX - touchX, 2) + Math.pow(subjectY - touchY, 2);
        const intersect = Math.pow(subjectR - touchR, 2) <= dist && dist <= Math.pow(subjectR + touchR, 2);

        if (intersect) {
          // change pos in all future frames to avoid glitches
          allFrames = allFrames.map((subjects, frameIndex) => {
            if (frameIndex >= scrubber.getCurrentFrame()) {
              return subjects.map((s, subjectIndex) => {
                if (subjectIndex === i) {
                  return {
                    x: touchX / scaleFactor,
                    y: touchY / scaleFactor
                  }
                }

                return s;
              });
            }

            return subjects;
          });
        } else {
          // draw non-intersecting touches
          // FYI this draws the touch halo 3x larger than the actual hit target size
          context.beginPath();
          context.arc(touchX, touchY, touchR * 3, 0, 2 * Math.PI, true);
          context.closePath();
          context.strokeStyle = 'rgba(0, 0, 200, 0.2)';
          context.lineWidth = 6;
          context.stroke();
        }
      }

      context.beginPath();
      context.arc(subject.x * scaleFactor, subject.y * scaleFactor, subjectR, 0, 2 * Math.PI, true);
      context.closePath();
      context.fillStyle = 'rgba(0, 0, 200, 0.2)';
      context.fill();
    }
  }

  window.requestAnimationFrame(() => renderCanvas());
})();

// NOTHING AFTER THIS LINE WILL RUN!!!