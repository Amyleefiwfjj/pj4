let shards = [];
let titleY;
let titleOpacity = 0;
let audio, fft, amplitude;
let globalSpeedX = 1; // Move right
let globalSpeedY = -1; // Move up
let cnv;
let particles = [];
let canPlayAudio = false;
function preload() {
    titleFont = loadFont('./assets/Title.ttf');
    bodyFont = loadFont('./assets/Content.ttf');
    audio = loadSound('./assets/start-scene.mp3');
}

function setup() {
    cnv = createCanvas(windowWidth, windowHeight); // Create canvas inside setup
    noStroke();
    textFont(titleFont);
    titleY = height;
    fft = new p5.FFT();
    amplitude = new p5.Amplitude();
    moveSound = loadSound('./assets/start-scene.mp3'); // assets 폴더에 파일이 있어야 합니다.
    cnv.mouseClicked(() => {
        if (!audio.isPlaying()) {
            audio.loop();
        }
    });


}
function draw() {
    background(0);

    // Scatter glass shards
    if (frameCount < 130) {
        for (let i = 0; i < 5; i++) {
            shards.push(new Shard(random(width), random(height), random(-3, 3), random(-3, 3)));
        }
    }

    for (let i = 0; i < shards.length; i++) {
        shards[i].update();
        shards[i].display();
    }
    // Generate particles
    if (frameCount < 130) {
        for (let i = 0; i < 10; i++) {
            particles.push(new Particle(random(width), random(height), random(-3, 3), random(-3, 3)));
        }
    }

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].display();
    }

    // After shards settle, title comes up
    if (frameCount > 150) {
        titleOpacity = map(frameCount, 150, 180, 0, 255);
        titleY = map(frameCount, 150, 180, height, height / 3);
        titleY = max(titleY, height / 3);
    }

    // Display the title
    fill(255, titleOpacity);
    textSize(80);
    textAlign(CENTER, CENTER);
    text("Interactive Chess", width / 2, titleY);
    mediaArt();
}
function mediaArt() {
    let vol = amplitude.getLevel();


    // Display amplitude-responsive particles
    let dynamicSize = map(vol, 0, 0.3, 50, width);
    fill(255, 100);
    ellipse(width / 2, height / 2, dynamicSize, dynamicSize);

    // Add interactive elements to the art
    if (frameCount % 5 === 0) {
        for (let i = 0; i < 5; i++) {
            particles.push(new Particle(random(width), random(height), random(-2, 2), random(-2, 2)));
        }
    }

    // Update and display particles
    for (let p of particles) {
        p.update();
        p.display();
    }
}

function drawCircle(x, y, size, alpha) {
    fill(150, alpha);
    ellipse(x, y, size, size);
}

class Shard {
    constructor(x, y, speedX, speedY) {
        this.x = x;
        this.y = y;
        // Add the global directional speed to the random speed
        this.speedX = speedX + globalSpeedX;
        this.speedY = speedY + globalSpeedY;
        this.size = random(10, 20);
        this.alpha = 255;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha = max(0, this.alpha - 5);
    }

    display() {
        fill(255, this.alpha);
        ellipse(this.x, this.y, this.size, this.size);
    }
}

class Particle {
    constructor(x, y, speedX, speedY) {
        this.pos = createVector(x, y);
        this.vel = createVector(speedX, speedY);
        this.size = random(5, 15);
        this.alpha = 255;
    }

    update() {
        this.pos.add(this.vel);
        this.alpha -= 2; // Fade particles over time
        if (this.alpha <= 0) {
            this.alpha = 0;
        }
    }

    display() {
        fill(255, this.alpha);
        noStroke();
        ellipse(this.pos.x, this.pos.y, this.size, this.size);
    }
}

// UI part to add the start button after a timeout
setTimeout(function () {
    // Start button creation
    let startButton = createButton('Start');
    startButton.style('font-size', '24px');
    startButton.style('font-family', 'Content, sans-serif');
    startButton.style('border', 'none');
    startButton.style('border-radius', '8px');
    startButton.style('padding', '12px 24px');
    startButton.style('cursor', 'pointer');
    startButton.style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.3)');
    startButton.style('position', 'absolute');
    startButton.style('z-index', '10');
    let btnX = (windowWidth - startButton.elt.offsetWidth) / 2;
    // Title is fixed at 1/3 of the screen height, so place the button below it (e.g., 50px down)
    let btnY = (height / 3) + 200;
    startButton.position(btnX, btnY);

    let css = `
    button:hover {
        background-color: rgb(92, 90, 90);
        box-shadow: 0 6px 8px rgba(0, 0, 0, 0.4);
    }
    `;
    let styleElem = createElement('style', css);
    styleElem.parent(document.head);

    // Button click event to navigate to index.html
    startButton.mousePressed(function () {
        window.location.href = "index.html";
    });

    console.log("Start button created!");
}, 3000);