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

const playToggle: HTMLDivElement = document.querySelector('.play-toggle');

let allFrames = [];
for (let i = 0; i <= 240; i++) {
  allFrames.push({
    subject: 'circle',
    x: 200,
    y: 200
  });
}

setInterval(() => {
  if (scrubber.isPlaying()) {
    scrubber.incrementFrame();
  }

  playToggle.innerHTML = scrubber.getCurrentFrame().toString(); // this is fking dirty
}, 1000 / scrubber.getFPS());


canvas.addEventListener('touchend', function(event) {
  event.preventDefault();
  touches = event.touches;
});

canvas.addEventListener('touchmove', function(event) {
  event.preventDefault();
  touches = event.touches;
});

canvas.addEventListener('touchstart', function(event) {
  event.preventDefault();
  touches = event.touches;
});

// main loop (HAS TO COME LAST - this is infinite duh)
(function renderCanvas() {
  context.clearRect(0, 0, width * scaleFactor, height * scaleFactor);

  // draw subjects
  const currentFrame = allFrames[scrubber.getCurrentFrame()];
  if (currentFrame) {
    const subjectX = currentFrame.x * scaleFactor;
    const subjectY = currentFrame.y * scaleFactor;

    // draw touches
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];

      const touchX = (touch.pageX - canvas.offsetLeft) * scaleFactor;
      const touchY = (touch.pageY - canvas.offsetTop) * scaleFactor;

      const rSubject = 150;
      const rTouch = 150;
      const dist = Math.pow(subjectX - touchX, 2) + Math.pow(subjectY - touchY, 2);
      const intersect = Math.pow(rSubject - rTouch, 2) <= dist && dist <= Math.pow(rSubject + rTouch, 2);

      if (intersect) {
        // change pos in all future frames to avoid glitches
        allFrames = allFrames.map((f, i) => {
          if (i >= scrubber.getCurrentFrame()) {
            return {
              ...f,
              x: touchX / scaleFactor,
              y: touchY / scaleFactor
            }
          }

          return f;
        });
      } else {
        // draw nonintersecting touch
        context.beginPath();
        context.arc(touchX, touchY, 150, 0, 2 * Math.PI, true);
        context.closePath();
        context.strokeStyle = 'rgba(0, 0, 200, 0.2)';
        context.lineWidth = 6;
        context.stroke();
      }
    }

    context.beginPath();
    context.arc(currentFrame.x * scaleFactor, currentFrame.y * scaleFactor, 150, 0, 2 * Math.PI, true);
    context.closePath();
    context.fillStyle = 'rgba(0, 0, 200, 0.2)';
    context.fill();
  }
  

  window.requestAnimationFrame(() => renderCanvas());
})();



const layers = [{
  name: 'Background'
}]

/*
var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var paint;

canvas.onmousedown = function (e: MouseEvent) {
  console.log(e)
  var mouseX = (e.pageX - canvas.offsetLeft) * scaleFactor;
  var mouseY = (e.pageY - canvas.offsetTop) * scaleFactor;
    
  paint = true;
  addClick(mouseX, mouseY, false);
  redraw();
}

canvas.onmousemove = function (e: MouseEvent) {
  var mouseX = (e.pageX - canvas.offsetLeft) * scaleFactor;
  var mouseY = (e.pageY - canvas.offsetTop) * scaleFactor;

  if (paint) {
    addClick(mouseX, mouseY, true);
    redraw();
  }
}

canvas.onmouseup = function (e: MouseEvent) {
  paint = false;
}

function addClick(x, y, dragging) {
  clickX.push(x);
  clickY.push(y);
  clickDrag.push(dragging);
}


function redraw(){
  context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
  
  context.strokeStyle = "#df4b26";
  context.lineJoin = "round";
  context.lineWidth = 5;
      
  for (var i=0; i < clickX.length; i++) {		
    context.beginPath();
    if(clickDrag[i] && i){
      context.moveTo(clickX[i-1], clickY[i-1]);
      }else{
        context.moveTo(clickX[i]-1, clickY[i]);
      }
      context.lineTo(clickX[i], clickY[i]);
      context.closePath();
      context.stroke();
  }
}

// data structure
// pages are not malleable, but all of their children are
// const notebook = [{
//   page_id: 1,
//   page_name: '1',
//   active: true,
//   thumbnail: '', // base64-encoded screenshot of the div?
//   children: [{
//     node: 'canvas'
//   }]
// }];




// attach event handlers to all malleable objects in our world
console.log(document.querySelectorAll('[data-malleable=true]'));
*/