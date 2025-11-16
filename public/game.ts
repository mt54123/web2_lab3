const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

if (!canvas || !ctx) {
    throw new Error("Canvas not found!");
}

// globalne konstante
const ROWS = 5;
const COLS = 10;
const BRICK_WIDTH = 69;
const BRICK_HEIGHT = 20;
const BRICK_PADDING_X = 30;
const BRICK_PADDING_Y = 15;
const BRICK_OFFSET_TOP = 100;
const BRICK_OFFSET_LEFT = 20;

const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 15;
const PADDLE_SPEED = 8;

const BALL_SIZE = 6;
const BALL_START_SPEED = 1;
const BALL_SPEED_INCREMENT = 0.1;

// RGB boje cigli
const brickColors = [
    "rgb(153,51,0)",     // smeđa
    "rgb(255,0,0)",      // crvena
    "rgb(255,153,204)",  // ružičasta
    "rgb(0,255,0)",      // zelena
    "rgb(255,255,153)"   // žuta
];

type Brick = {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    destroyed: boolean;
};

type Paddle = { x: number; y: number; width: number; height: number };
type Ball = { x: number; y: number; dx: number; dy: number; size: number };

let bricks: Brick[] = [];
let paddle: Paddle;
let ball: Ball;
let currentScore = 0;
let gameState: 'playing' | 'gameover' | 'win';
let moveLeft = false;
let moveRight = false;

// tipke
window.addEventListener("keydown", (e) =>
{
    if (e.code === "ArrowLeft" || e.key === "a") moveLeft = true;
    if (e.code === "ArrowRight" || e.key === "d") moveRight = true;
});

window.addEventListener("keyup", (e) =>
{
    if (e.code === "ArrowLeft" || e.key === "a") moveLeft = false;
    if (e.code === "ArrowRight" || e.key === "d") moveRight = false;
});

// tekst
function ispisiTekstCentar(tekst: string, y: number, velicina: number, font: string, bold: boolean = false, italic: boolean = false, boja: string = 'white'): void
{
    let stil = '';
    if (italic) stil += 'italic ';
    if (bold) stil += 'bold ';
    stil += `${velicina}px ${font}`;
    ctx.fillStyle = boja;
    ctx.font = stil;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tekst, canvas.width / 2, y);
}

// slusa space
function listenSpace(callback: () => void): void
{
    function handler(event: KeyboardEvent)
    {
        if (event.code === 'Space' || event.key === ' ')
            {
            callback();
            event.preventDefault();
            window.removeEventListener('keydown', handler);
        }
    }
    window.addEventListener('keydown', handler);
}

// kreiraj ciglu
function createBrick(x: number, y: number, width: number, height: number, color: string): Brick
{
    return { x, y, width, height, color, destroyed: false };
}

// generiraj ploču
function generateBoard(): Brick[]
{
    const tempBricks: Brick[] = [];
    for (let row = 0; row < ROWS; row++)
        {
        for (let col = 0; col < COLS; col++)
        {
            const x = BRICK_OFFSET_LEFT + col * (BRICK_WIDTH + BRICK_PADDING_X);
            const y = BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_PADDING_Y);
            tempBricks.push(createBrick(x, y, BRICK_WIDTH, BRICK_HEIGHT, brickColors[row]));
        }
    }
    return tempBricks;
}

// crtanje cigli
function drawBricks(bricks: Brick[])
{
    bricks.forEach(brick =>
    {
        if (!brick.destroyed)
        {
            ctx.fillStyle = brick.color;
            ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            ctx.strokeStyle = "rgba(0,0,0,0.3)";
            ctx.lineWidth = 2;
            ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        }
    });
}

// crtanje palice
function drawPaddle(x: number, y: number, width: number = PADDLE_WIDTH, height: number = PADDLE_HEIGHT)
{
    ctx.fillStyle = "white";
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
}

// crtanje loptice
function drawBall(x: number, y: number, size: number = BALL_SIZE)
{
    ctx.fillStyle = "white";
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
}

// highscore
function getHighScore(): number
{
    const score = localStorage.getItem("highScore");
    return score ? parseInt(score) : 0;
}

function drawHighScore(): void
{
    const score = getHighScore();
    ctx.fillStyle = "white";
    ctx.font = "20px Helvetica";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(`${score}`, canvas.width - 100, 20);
}

function drawCurrentScore(): void
{
    ctx.fillStyle = "white";
    ctx.font = "20px Helvetica";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`${currentScore}`, 20, 20);
}

// win screen
function winScreen(playerScore: number): void
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ispisiTekstCentar("VICTORY", canvas.height / 2 - 40, 40, "Helvetica", true);
    ispisiTekstCentar(`YOUR SCORE: ${playerScore}`, canvas.height / 2, 24, "Helvetica", true);
    ispisiTekstCentar("Press SPACE to continue the game", canvas.height / 2 + 40, 16, "Helvetica", false, true);
    listenSpace(() => Start());
}

// update igre
function update(): void
{
    moveBall();
    movePaddle();
    checkHit();
    updateScore();
};

// crtanje svega
function updateBoardDrawnig(): void
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks(bricks);
    drawPaddle(paddle.x, paddle.y);
    drawBall(ball.x, ball.y);
    drawHighScore();
    drawCurrentScore();
};

// game loop
function gameLoop()
{
    if (gameState === 'playing')
    {
        update();
        updateBoardDrawnig();
        requestAnimationFrame(gameLoop);
    }
    else if (gameState === 'gameover')
    {
        gameOver();
    }
    else if (gameState == 'win')
    {
        winScreen(currentScore);
    }
};

// pomak loptice
function moveBall()
{
    if (!ball) return;

    ball.x += ball.dx;
    ball.y += ball.dy;

    // zidovi
    if (ball.x <= 0)
    {
        ball.x = 0; ball.dx *= -1;
    }
    if (ball.x + ball.size >= canvas.width)
    {
        ball.x = canvas.width - ball.size; ball.dx *= -1;
    }
    if (ball.y <= 0)
    {
        ball.y = 0; ball.dy *= -1;
    }

    // game over
    if (ball.y >= canvas.height)
    {
        gameState = 'gameover';
        return;
    }

    // sudar s palicom
    if (ball.y + ball.size >= paddle.y &&
        ball.x + ball.size >= paddle.x &&
        ball.x <= paddle.x + paddle.width)
    {
        ball.dy *= -1;
        ball.y = paddle.y - ball.size;

        // dodjeli horizontalnu brzinu ako je 0
        if (ball.dx === 0) {
            const direction = Math.random() < 0.5 ? -1 : 1;
            ball.dx = BALL_START_SPEED * direction;
        }
    }
}

// pomak palice
function movePaddle()
{
    if (moveLeft)
    {
        paddle.x -= PADDLE_SPEED; if (paddle.x < 0) paddle.x = 0;
    }
    if (moveRight)
    {
        paddle.x += PADDLE_SPEED; if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
    }
}

// kolizija s ciglama
function checkHit(): void
{
    for (let brick of bricks)
    {
        if (brick.destroyed) continue;

        const hit =
            ball.x < brick.x + brick.width &&
            ball.x + ball.size > brick.x &&
            ball.y < brick.y + brick.height &&
            ball.y + ball.size > brick.y;

        if (hit)
        {
            brick.destroyed = true;

            // provjeri udarac u kut mijenjaj dx
            const ballCenterX = ball.x + ball.size/2;
            const ballCenterY = ball.y + ball.size/2;
            const brickCenterX = brick.x + brick.width/2;
            const brickCenterY = brick.y + brick.height/2;

            if (Math.abs(ballCenterX - brickCenterX) > brick.width/2 * 0.8)
            {
                ball.dx += (ball.dx > 0 ? BALL_SPEED_INCREMENT : -BALL_SPEED_INCREMENT);
            }
            if (Math.abs(ballCenterY - brickCenterY) > brick.height/2 * 0.8)
            {
                ball.dy += (ball.dy > 0 ? BALL_SPEED_INCREMENT : -BALL_SPEED_INCREMENT);
            }

            //bounce
            ball.dy *= -1;

            currentScore += 1;
            break;
        }
    }
}

// update score i pobjeda
function updateScore(): void
{
    const high = getHighScore();
    if (currentScore > high)
    {
        localStorage.setItem("highScore", currentScore.toString());
    }

    const allDestroyed = bricks.every(b => b.destroyed);
    if (allDestroyed)
    {
        gameState = 'win';
        winScreen(currentScore);
    }
}

// postavi lopticu na start
function startBall(): void
{
    ball.x = paddle.x + paddle.width / 2 - BALL_SIZE/2;
    ball.y = paddle.y + paddle.height /2 - 3; // loptica mora na pocetku biti malo visa od paddle
    const direction = Math.random() < 0.5 ? -1 : 1;
    ball.dx = BALL_START_SPEED * direction;
    ball.dy = -BALL_START_SPEED;
};

// game over
function gameOver(): void
{
    const font = 'Helvetica';
    const yNaslov = canvas.height/2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ispisiTekstCentar("GAME OVER", yNaslov, 40, font, true, false, "yellow");
    listenSpace(() => Start());
};

// start ekran
function Start(): void
{
    const fontGlavni = 'Helvetica';
    const fontPodnaslov = 'Helvetica';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const yNaslov = canvas.height / 2;
    ispisiTekstCentar("BREAKOUT", yNaslov, 36, fontGlavni, true, false);
    const yPodnaslov = yNaslov + 36/2 + 10 + 18/2;
    ispisiTekstCentar("Press SPACE to begin", yPodnaslov, 18, fontPodnaslov, true, true);

    listenSpace(() =>
    {
        currentScore = 0;
        paddle = { x: canvas.width/2 - PADDLE_WIDTH/2, y: canvas.height-30, width: PADDLE_WIDTH, height: PADDLE_HEIGHT };
        ball = { x: 0, y: 0, dx: 0, dy: 0, size: BALL_SIZE };
        bricks = generateBoard();
        startBall();
        gameState = 'playing';
        gameLoop();
    });
}

Start();
