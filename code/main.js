let board = [];
let selectedPiece = null;
let turn = 'w'; // 'w'는 백, 'b'는 흑
let gameOver = false;
let winner = "";
let particles = [];
let titleFont;
let cnv, resetButton, container, checkmate, imgb, imgw, moveSound, audio, fft, amplitude, tileSize;
let condition = 0;
let checkCondition = 0;
let stars = [];
let effectTimer = 0;  // 타이머 변수 (2초 동안 효과를 지속)
let maxEffectTime = 1500;
let effectActive = false;
let AudioParticles = [];
function preload() {
    titleFont = loadFont('./assets/Title.ttf');
    audio = loadSound('./assets/main1.mp3');
    checkmate = loadSound('./assets/checkmate.mp3');
    starImage = loadImage('./assets/star.png');
    imgb = loadImage('./assets/Vector.png');
    imgw = loadImage('./assets/Vector2.png');
}
function setup() {
    container = createDiv('');
    container.style('display', 'flex');
    container.style('flex-direction', 'column');
    container.style('align-items', 'center');
    container.style('padding', '10px'); // 페이지 상단 여백

    // reset 버튼 생성 및 스타일링 (고급스러운 블랙 & 화이트)
    resetButton = createButton('Reset');
    resetButton.style('font-family', 'Helvetica, Arial, sans-serif');
    resetButton.style('font-size', '20px');
    resetButton.style('background-color', 'black');
    resetButton.style('color', 'white');
    resetButton.style('margin', '40px');
    resetButton.style('padding', '10px 20px');
    resetButton.style('border', '2px solid white');
    resetButton.style('border-radius', '5px');
    resetButton.style('cursor', 'pointer');
    container.child(resetButton);

    // 단 하나의 캔버스 생성 및 container에 추가
    cnv = createCanvas(480, 480);
    container.child(cnv);

    textFont(titleFont);
    tileSize = width / 8;
    for (let i = 0; i < 8; i++) {
        board[i] = new Array(8).fill(null);
    }
    setupPieces();

    fft = new p5.FFT();
    amplitude = new p5.Amplitude();
    moveSound = loadSound('./assets/effect.mp3'); // assets 폴더에 파일이 있어야 합니다.
    // 캔버스 클릭 시 백그라운드 음악 시작
    cnv.mouseClicked(() => {
        if (!audio.isPlaying()) {
            audio.loop();
        }
    });

    resetButton.mousePressed(function () {
        resetGame();
        console.log("Reset 버튼 클릭됨 - 게임 초기화");
    });


}
function drawMediaArt() {
    // 배경 음악의 오디오 레벨과 주파수 데이터를 가져옴
    let vol = amplitude.getLevel();
    let spectrum = fft.analyze();

    // 어두운 배경색으로 캔버스를 채움
    background(20);
    noStroke();

    // FFT 스펙트럼 데이터를 이용해 캔버스 중앙을 기준으로 여러 개의 동적인 원을 그림
    for (let i = 0; i < spectrum.length; i += 10) {
        let x = map(i, 0, spectrum.length, 0, width);
        let circleSize = map(spectrum[i], 0, 255, 10, 100);
        let alpha = map(spectrum[i], 0, 255, 50, 200);
        fill(150, alpha);
        ellipse(x, height / 2, circleSize, circleSize);
    }

    // amplitude(볼륨)에 따라 캔버스 중앙에 확장되는 원을 그림
    let dynamicSize = map(vol, 0, 0.3, 50, width);
    fill(255, 100);
    ellipse(width / 2, height / 2, dynamicSize, dynamicSize);
}
function draw() {
    drawBack();
    drawMediaArt();
    drawBoard();
    drawPieces();

    updateParticles();
    displayParticles();
    checkGameOver();

    if (isKingInCheck(turn)) {
        if (isCheckmate(turn)) {
            gameOver = true;
            winner = (turn === 'w') ? "Black wins by checkmate!" : "White wins by checkmate!";
            if (winner === "Black wins by checkmate!") {
                blackWins();  // 백이 체크메이트 당한 경우, blackWins 호출
            } else if (winner === "White wins by checkmate!") {
                whiteWins();  // 흑이 체크메이트 당한 경우, whiteWins 호출
            }
        } else {
            checkMessage = "Check!";
        }
    } else {
        checkMessage = "";
    }


    if (gameOver) {
        fill(0);
        textSize(32);
        textAlign(CENTER, CENTER);
        text(winner, width / 2, height / 2);
    } else if (checkMessage !== "") {
        fill(255, 0, 0);
        textSize(24);
        textAlign(CENTER, TOP);
        text(checkMessage, width / 2, 10);
    }

    if (checkCondition === 1) {
        if (!checkmate.isPlaying()) {
            checkmate.play();
        }
        checkmateEffect();
        checkCondition = 0;
    }

}
function checkmateEffect() {
    if (checkCondition === 1 && !effectActive) {
        effectActive = true;  // 이제부터 별들이 보이도록 설정
        spawnStars(10);  // 별들을 생성
        effectTimer = millis();
    }

    // 은하수 애니메이션 (별들이 떨어짐)
    for (let i = stars.length - 1; i >= 0; i--) {
        let star = stars[i];
        updateStar(star);
        displayStar(star);

        // 1초가 지나면 별을 배열에서 제거
        if (millis() - star.startTime > maxEffectTime) {
            stars.splice(i, 1);  // 별을 배열에서 제거
        }
    }    // 2초가 지나면 별들이 멈추게 하고 새로운 효과를 시작할 수 있게 설정
    if (millis() - effectTimer > maxEffectTime) {
        effectActive = false;
    }
}
function spawnStars(num) {
    for (let i = 0; i < num; i++) {
        stars.push(createStar());
    }
}
function createStar() {
    return {
        img: starImage,
        x: random(width),  // 랜덤한 x 좌표
        y: random(-200, -100),  // 화면 위쪽에서 시작
        size: random(10, 30),  // 랜덤한 크기
        speed: random(3, 8),  // 랜덤한 속도
        alpha: random(100, 255),  // 랜덤한 투명도
        startTime: millis()
    };
}
function updateStar(star) {
    star.y += star.speed;  // 속도에 따라 별이 아래로 떨어짐

    // 화면 밖으로 나가면 다시 위로 위치 변경
    if (star.y > height) {
        star.y = random(-200, -100);  // 위쪽에서 다시 떨어지도록
        star.x = random(width);  // 랜덤한 x 위치
    }
}
function displayStar(star) {
    // 별을 그리기
    tint(255, star.alpha);  // 투명도 적용
    image(star.img, star.x, star.y, star.size, star.size);
}
function resetGame() {
    // board 배열 초기화
    board = [];
    for (let i = 0; i < 8; i++) {
        board[i] = new Array(8).fill(null);
    }
    // 체스 말 초기 배치 재설정
    setupPieces();

    // 기타 게임 상태 초기화
    selectedPiece = null;
    turn = 'w';
    gameOver = false;
    winner = "";
    // (필요한 경우 particles 등 다른 요소도 초기화)
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.update();
        if (p.isOffScreen()) {
            particles.splice(i, 1); // 화면 밖으로 나가면 제거
        }
    }
}

function displayParticles() {
    for (let p of particles) {
        p.display();
    }
}

function setupPieces() {
    // 흑 말 배치 (윗줄)
    board[0][0] = { type: 'R', color: 'b' };
    board[0][1] = { type: 'N', color: 'b' };
    board[0][2] = { type: 'B', color: 'b' };
    board[0][3] = { type: 'Q', color: 'b' };
    board[0][4] = { type: 'K', color: 'b' };
    board[0][5] = { type: 'B', color: 'b' };
    board[0][6] = { type: 'N', color: 'b' };
    board[0][7] = { type: 'R', color: 'b' };
    for (let j = 0; j < 8; j++) {
        board[1][j] = { type: 'P', color: 'b' };
    }
    // 백 말 배치 (아랫줄)
    board[7][0] = { type: 'R', color: 'w' };
    board[7][1] = { type: 'N', color: 'w' };
    board[7][2] = { type: 'B', color: 'w' };
    board[7][3] = { type: 'Q', color: 'w' };
    board[7][4] = { type: 'K', color: 'w' };
    board[7][5] = { type: 'B', color: 'w' };
    board[7][6] = { type: 'N', color: 'w' };
    board[7][7] = { type: 'R', color: 'w' };
    for (let j = 0; j < 8; j++) {
        board[6][j] = { type: 'P', color: 'w' };
    }
}

function drawBoard() {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if ((i + j) % 2 === 0) {
                fill(240);
            } else {
                fill(100);
            }
            rect(j * tileSize, i * tileSize, tileSize, tileSize);

            if (selectedPiece && selectedPiece.row === i && selectedPiece.col === j) {
                fill(255, 0, 0, 100);
                rect(j * tileSize, i * tileSize, tileSize, tileSize);
            }
        }
    }
}

function drawPieces() {
    textSize(32);
    textAlign(CENTER, CENTER);
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            let piece = board[i][j];
            if (piece) {
                // 기물 내부 색상: 흰색이면 255, 아니면 0
                fill(piece.color === 'w' ? 255 : 0);

                // 기물 외곽선: 흰색이면 검은색, 아니면 흰색
                if (piece.color === 'w') {
                    stroke(0);
                } else {
                    stroke(255);
                }
                text(piece.type, j * tileSize + tileSize / 2, i * tileSize + tileSize / 2);
            }
        }
    }
}

function mousePressed() {
    if (gameOver) return;

    let col = floor(mouseX / tileSize);
    let row = floor(mouseY / tileSize);
    if (row < 0 || row > 7 || col < 0 || col > 7) return;

    if (selectedPiece) {
        let piece = board[selectedPiece.row][selectedPiece.col];
        let target = board[row][col];

        if (piece && isValidMove(piece, selectedPiece.row, selectedPiece.col, row, col)) {
            let isCapture = target && target.color !== piece.color;
            board[row][col] = piece;
            board[selectedPiece.row][selectedPiece.col] = null;
            spawnParticles(row, col, piece.type, isCapture);
            moveSound.play();
            turn = (turn === 'w') ? 'b' : 'w';
        }
        selectedPiece = null;
    } else {
        let piece = board[row][col];
        if (piece && piece.color === turn) {
            selectedPiece = { row, col };
        }
    }
    checkGameOver();
}

function mouseMoved() {
    let mouseXForce = map(mouseX, 0, width, -10, 10);
    let mouseYForce = map(mouseY, 0, height, -10, 10);

    for (let p of particles) {
        p.speedX += mouseXForce * 0.1;
        p.speedY += mouseYForce * 0.1;
    }
}

class Particle {
    constructor(row, col, pieceType, isCapture = false) {
        this.x = col * tileSize + tileSize / 2;
        this.y = row * tileSize + tileSize / 2;
        this.size = random(5, 15);
        this.alpha = 255;
        this.pieceType = pieceType;
        this.isCapture = isCapture;

        // 초기 Perlin noise 값
        this.noiseX = random(1000);
        this.noiseY = random(1000);
    }

    update() {
        let noiseFactorX = map(noise(this.noiseX), 0, 1, -2, 2);
        let noiseFactorY = map(noise(this.noiseY), 0, 1, -2, 2);

        this.x += noiseFactorX;
        this.y += noiseFactorY;

        this.noiseX += 0.05;
        this.noiseY += 0.05;

        this.alpha -= 5;  // 시간이 지남에 따라 서서히 사라짐
    }

    isOffScreen() {
        return (this.alpha <= 0 || this.x < 0 || this.x > width || this.y < 0 || this.y > height);
    }

    display() {
        noStroke();
        if (this.pieceType === 'P') {
            fill(0, 255, 0, this.alpha); // Pawn: 초록색
            this.y += sin(frameCount * 0.1) * 2;
        } else if (this.pieceType === 'R') {
            fill(0, 0, 255, this.alpha); // Rook: 파란색
        } else if (this.pieceType === 'N') {
            fill(255, 0, 0, this.alpha); // Knight: 빨간색
            this.x += sin(frameCount * 0.1) * 2;
            this.y += cos(frameCount * 0.1) * 2;
        } else if (this.pieceType === 'B') {
            fill(255, 255, 0, this.alpha); // Bishop: 노란색
            this.x += sin(frameCount * 0.05) * 3;
            this.y += cos(frameCount * 0.05) * 3;
        } else if (this.pieceType === 'Q') {
            fill(255, 0, 255, this.alpha); // Queen: 마젠타
            this.size += 1;
        } else if (this.pieceType === 'K') {
            fill(0, 255, 255, this.alpha); // King: 시안
            this.x += sin(frameCount * 0.05) * 5;
            this.y += cos(frameCount * 0.05) * 5;
        }

        if (this.isCapture) {
            fill(255, 0, 0, this.alpha); // 캡처 시 붉게 표시
            this.size += 2;
        }

        ellipse(this.x, this.y, this.size);
    }
}
function spawnParticles(row, col, pieceType, isCapture = false) {
    let numParticles = random(50, 100);
    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle(row, col, pieceType, isCapture));
    }
}

function isValidMove(piece, fromRow, fromCol, toRow, toCol) {
    let target = board[toRow][toCol];
    if (target && target.color === piece.color) return false;

    let dRow = toRow - fromRow;
    let dCol = toCol - fromCol;

    switch (piece.type) {
        case 'P':
            let direction = (piece.color === 'w') ? -1 : 1;
            if (dCol === 0 && dRow === direction && !target) {
                return true;
            }
            if (dCol === 0 && dRow === 2 * direction && !target) {
                if ((piece.color === 'w' && fromRow === 6) || (piece.color === 'b' && fromRow === 1)) {
                    if (!board[fromRow + direction][fromCol]) {
                        return true;
                    }
                }
            }
            if (abs(dCol) === 1 && dRow === direction && target && target.color !== piece.color) {
                return true;
            }
            return false;

        case 'R':
            if (dRow !== 0 && dCol !== 0) return false;
            if (!isPathClear(fromRow, fromCol, toRow, toCol)) return false;
            return true;

        case 'N':
            if ((abs(dRow) === 2 && abs(dCol) === 1) || (abs(dRow) === 1 && abs(dCol) === 2)) {
                return true;
            }
            return false;

        case 'B':
            if (abs(dRow) !== abs(dCol)) return false;
            if (!isPathClear(fromRow, fromCol, toRow, toCol)) return false;
            return true;

        case 'Q':
            if (dRow === 0 || dCol === 0 || abs(dRow) === abs(dCol)) {
                if (!isPathClear(fromRow, fromCol, toRow, toCol)) return false;
                return true;
            }
            return false;

        case 'K':
            if (abs(dRow) <= 1 && abs(dCol) <= 1) {
                let backupFrom = board[fromRow][fromCol];
                let backupTo = board[toRow][toCol];
                board[toRow][toCol] = piece;
                board[fromRow][fromCol] = null;
                let safe = !isKingInCheck(piece.color);
                board[fromRow][fromCol] = backupFrom;
                board[toRow][toCol] = backupTo;
                return safe;
            }
            return false;
    }

    return false;
}

function isPathClear(fromRow, fromCol, toRow, toCol) {
    let dRow = toRow - fromRow;
    let dCol = toCol - fromCol;
    let stepRow = dRow === 0 ? 0 : dRow / abs(dRow);
    let stepCol = dCol === 0 ? 0 : dCol / abs(dCol);
    let curRow = fromRow + stepRow;
    let curCol = fromCol + stepCol;
    while (curRow !== toRow || curCol !== toCol) {
        if (board[curRow][curCol]) return false;
        curRow += stepRow;
        curCol += stepCol;
    }
    return true;
}

function isKingInCheck(color) {
    let kingPos = null;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            let piece = board[i][j];
            if (piece && piece.type === 'K' && piece.color === color) {
                kingPos = { row: i, col: j };
                break;
            }
        }
        if (kingPos) break;
    }
    if (!kingPos) return false;

    let opponent = color === 'w' ? 'b' : 'w';
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            let piece = board[i][j];
            if (piece && piece.color === opponent) {
                if (isValidMove(piece, i, j, kingPos.row, kingPos.col)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function isCheckmate(color) {
    if (!isKingInCheck(color)) return false;

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            let piece = board[i][j];
            if (piece && piece.color === color) {
                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 8; c++) {
                        if (isValidMove(piece, i, j, r, c)) {
                            let backupFrom = board[i][j];
                            let backupTo = board[r][c];
                            board[r][c] = piece;
                            board[i][j] = null;
                            let stillInCheck = isKingInCheck(color);
                            board[i][j] = backupFrom;
                            board[r][c] = backupTo;
                            if (!stillInCheck) return false;
                            else checkCondition = 1; // 체크메이트가 아님일 때 checkCondition을 1로 설정
                        }
                    }
                }
            }
        }
    }
    return true;
}

function checkGameOver() {
    condition = 1;
    let whiteKingFound = false;
    let blackKingFound = false;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            let piece = board[i][j];
            if (piece && piece.type === 'K') {
                if (piece.color === 'w') whiteKingFound = true;
                if (piece.color === 'b') blackKingFound = true;
            }
        }
    }
    if (!whiteKingFound || !blackKingFound) {
        gameOver = true;
        winner = !whiteKingFound ? "Black wins!" : "White wins!";
        noLoop();
    }
}
class AudioParticle {
    constructor(x, y, speedX, speedY, frequencyData, amplitude) {
        // Start particles outside the chessboard grid but within the visible canvas area
        this.x = random(width) < width / 8 ? random(-50, -100) : random(width * 7 / 8, width + 50);
        this.y = random(height) < height / 8 ? random(-50, -100) : random(height * 7 / 8, height + 50);
        this.size = random(5, 15);
        this.alpha = 255;
        this.speedX = speedX;
        this.speedY = speedY;

        // Initial Perlin noise values for smooth movement
        this.noiseX = random(1000);
        this.noiseY = random(1000);

        // Particle color and size adjustment based on audio frequency and volume
        this.color = color(random(255), random(255), random(255));  // Random color
        this.sizeFactor = map(frequencyData, 0, 255, 10, 100);  // Adjust size based on frequency data
        this.alphaFactor = map(amplitude, 0, 1, 50, 200);  // Adjust transparency based on volume level
    }

    update() {
        // Add Perlin noise-based movement
        let noiseFactorX = map(noise(this.noiseX), 0, 1, -2, 2);
        let noiseFactorY = map(noise(this.noiseY), 0, 1, -2, 2);

        this.x += noiseFactorX + this.speedX;
        this.y += noiseFactorY + this.speedY;

        this.noiseX += 0.05;
        this.noiseY += 0.05;

        this.alpha -= 5;  // Gradually fade the particle
    }

    isOffScreen() {
        // Check if the particle is off the canvas
        return (this.alpha <= 0 || this.x < 0 || this.x > width || this.y < 0 || this.y > height);
    }

    display() {
        // Only display particles outside the chessboard (8x8 grid)
        let tileSize = width / 8;
        let boardMinX = 0;
        let boardMinY = 0;
        let boardMaxX = tileSize * 8;
        let boardMaxY = tileSize * 8;

        // If the particle is outside the board, display it
        if (this.x < boardMinX || this.x > boardMaxX || this.y < boardMinY || this.y > boardMaxY) {
            noStroke();
            fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], this.alpha);
            ellipse(this.x, this.y, this.size + this.sizeFactor, this.size + this.sizeFactor);  // Draw with dynamic size and color
        }
    }
}

function drawBack() {
    let vol = amplitude.getLevel();
    let spectrum = fft.analyze();
    background(20);
    if (frameCount % 5 === 0) {
        for (let i = 0; i < 10; i++) {
            let speedX = random(-2, 2);
            let speedY = random(-2, 2);
            AudioParticles.push(new AudioParticle(random(width), random(height), speedX, speedY, spectrum[frameCount % spectrum.length], vol));
        }
    }

    // 7. Update and display the new audio particles
    for (let p of AudioParticles) {
        p.update();
        p.display();
    }
    for (let i = 0; i < spectrum.length; i += 10) {
        let x = map(i, 0, spectrum.length, 0, width);
        let size = map(spectrum[i], 0, 255, 10, 100);
        let alpha = map(spectrum[i], 0, 255, 50, 200);
        fill(255, alpha);  // White with varying transparency
        ellipse(x, height / 2, size, size);  // Draw the circle
    }

    // 11. Draw the center circle based on volume level
    let dynamicSize = map(vol, 0, 0.3, 50, width);  // Adjust size based on volume level
    fill(255, 100);
    ellipse(width / 2, height / 2, dynamicSize, dynamicSize);  // Center circle

}
