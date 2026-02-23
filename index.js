const canvas = document.getElementById("canvasGame");
const ctx = canvas.getContext("2d");

const startTag = document.getElementById("startTag");
const restartBtn = document.getElementById("restartBtn");

const topAdvice = document.getElementById("topAdvice");
const scoreDisplay = document.getElementById("scoreDisplay");

const nightComing = document.getElementById("nightComing");
const beeGif = document.getElementById("beeGif");

const bossWarningMsg = document.getElementById("bossWarningMsg");

const ptsSoundEffect = new Audio("./sound-effects/100pts.mp3");
const failSoundEffect = new Audio("./sound-effects/fail.mp3");
const turkeyGobble1SE = new Audio("./boss/turkey-gobble.mp3");
const turkeySquawk1SE = new Audio("./boss/turkey-squawk.mp3");
const turkeyGobble2SE = new Audio("./boss/turkey-gobble.mp3");


const turkeySoundEffects = [turkeyGobble1SE, turkeySquawk1SE, turkeyGobble2SE];

const gameMusicDay = new Audio("./musics/day-retro-pop.mp3");
const gameMusicNight = new Audio("./musics/night-neon-arcade.mp3");
const gameMusicBoss = new Audio("./musics/boss-fight.mp3");

const MUSICARRAY = [gameMusicDay, gameMusicNight, gameMusicBoss]

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const HEIGHTPROPORTION = 0.8;
const NUMLEAVES = 10;
const NUMCIRCLES = 5;

const TREESPEED = 0.3; //number of pixels per milisecond;
const CLOUDSPEED = 0.2;
const BALLOONSPEED = 0.3;
const BEESPEED = 0.3;

const SCORECONSTANT = 10;//PROPORTIONNALITY CONSTANT
const DAYTIMELIMIT = 100;//score points (100 is the same as 10 * treeCount)
const HUELIMIT = 50;//degrees

const BOSSSTART = 200;
const BOSSFIGHTDURATION = 45000;//in ms
const BOSSWEAPONSPEED = 0.35;

let delta = 0;
let lastTime = 0;

let treeArray = [];
let timeSinceLastTree = 0;
let nextTreeDelay;
let treeCount = 0;


let cloudArray = [];
let timeSinceLastCloud = 0;
let nextCloudDelay;


let wantsToFly = false;
let falling = false;
let score = 0;
let lastScore = 0;
let started = false;
let ended = false;

let maxAltitude;
let midAltitude;
let groundLine;

let momentOfTheDay = "day";
let hue = 0;

let bossState = "inactive"; //"inactive", "pending", "active"
let bossWeaponArray = [];
let weaponCount;
let timeSinceLastWeapon;
let nextWeaponDelay;



///////////////////////////////////////////////////////🎈 THE HOT AIR BALLOON 🎈///////////////////////////////////////////////////////

const basket = {

    //this is the same as groundLine - this.height and it represents the ground for the balloon
    _y : groundLine - 0.7 * 0.125 * canvas.height,

    _width: 0.125 * canvas.height,

    //THIS GETS STRANGE (using getters) WHEN RESIZING THE PAGE
    get width() {
        return this._width;
    },
    set width(value) {
        this._width = value;
    },

    get height() {
        return 0.7 * this.width;
    },
    get x() {
        return 0.125 * canvas.width;
    },
    get y(){
        return this._y;
    },

    set y(value) {
        this._y = value;
    },

    update() {
       
        if(this.y <= maxAltitude && !falling && bossState === "inactive"){// I ADDED !bossMode TO ENSURE THAT WE CAN STAY AT THE TOP OF THE SCREEN WHEN THE BOSS IS THERE.
            falling = true;
        }
        if(this.y >= midAltitude && falling){
            falling = false;
        }
        
        const changeInY = BALLOONSPEED * delta;

        if(falling){
            balloon.velocityY = changeInY;
        }
        else if((!wantsToFly && this.y < groundLine - this.height - changeInY)){
            balloon.velocityY = changeInY;
        }
        else if(wantsToFly && this.y > maxAltitude){
            balloon.velocityY = -changeInY;
        }
        else{
            balloon.velocityY = 0;
        }
        this.y += balloon.velocityY;
    },


    draw() {
        ctx.fillStyle = "rgba(248, 7, 7, 1)";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

const rail = {

    //this is the same as basket.y - 1.33 * this.height 
    _y : basket.y - 1.33 * 0.25 * basket.height,
    
    get height() {
        return 0.25 * basket.height;
    },
    get width() {
        return 0.8 * basket.width;
    },
    get x() {
        return basket.x + 0.1 * basket.width;
    },
    get y() {
        return this._y;
    },

    set y(value) {
        this._y = value;
    },
    

    update() {
        this.y = basket.y - this.height * 1.33;
    },
    draw() {
        ctx.fillStyle = "rgba(20, 227, 210, 1)";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}




const cable1 = {

    // this is the equivalent of basket.y - cablesHeight
    _y: basket.y - 1.25 * basket.height,

    get height() {
        return 1.25 * basket.height;
    },
    get width() {
        return 0.1 * basket.width;
    },
    get x() {
        return rail.x;
    },
    get y() {
        return this._y;
    },

    set y(value) {
        this._y = value;
    },

    update() {
        this.y = basket.y - this.height;
    },
    draw() {
        ctx.fillStyle = "rgba(7, 47, 248, 1)";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

const cable2 = {

    _y: cable1.y,

    get height() {
        return 1.25 * basket.height;
    },
    get width() {
        return 0.1 * basket.width;
    },
    get x() {
        return basket.x + basket.width - this.width - 0.1 * basket.width;
    },
    get y() {
        return this._y;
    },

    set y(value) {
        this._y = value;
    },

    update() {
        this.y = basket.y - this.height;
    },
    draw() {
        ctx.fillStyle = "rgba(7, 47, 248, 1)";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    },
}


const envelope = {

    _y: basket.y - cable1.height - 0.5 * this.radius,

    get x() {
        return basket.x + 0.5 * basket.width;
    },
    get radius() {
        return 0.75 * basket.width;
    },
    get y() {
        return this._y;
    },

    set y(value) {
        this._y = value;
    },


    update() {
        this.y = basket.y - cable1.height - 0.5 * this.radius;
    },

    draw() {
        ctx.fillStyle = "rgba(248, 59, 7, 1)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}


const balloon = {

    _velocityY: 0,

    get velocityY() {
        return this._velocityY;
    },

    set velocityY(value) {
        this._velocityY = value;
    },

    draw() {
        rail.update();
        cable1.update();
        cable2.update();
        envelope.update();

        basket.draw();
        rail.draw();
        cable1.draw();
        cable2.draw();
        envelope.draw();
    }
};


///////////////////////////////////////////////////////🌳 ELEMENTS 👹 CLASSES 🌥️///////////////////////////////////////////////////////


class Tree{
    constructor(){
        this.k = Math.random();
        this._x = 1.2 * canvas.width;
        this.trunkColor = `rgba(225, 14, 14, ${Math.random() * 0.2 + 0.8})`;
        this.leavesColor = `rgb(60, 208, 54, ${Math.random() * 0.5 + 0.5})`;
        this.leavesX = Array(NUMLEAVES).fill(null);
        this.leavesY = Array(NUMLEAVES).fill(null);
        this.leavesRadius = Array(NUMLEAVES).fill(null);
        treeArray.push(this);
    }

    // I STILL NEED TO CHANGE LEAVES RADIUS AND Y POSITIONS ON RESIZE (USING GETTERS AND SETTERS)

    get width(){
        return this.k * 0.02 * canvas.height + 0.04 * canvas.height;
    }
    get radius(){
        return this.width/2;
    }
    get height(){
        return 5 * this.width;
    }
    get y(){
        return groundLine - this.height;
    }

    get x(){
        return this._x;
    }
    set x(value){
        this._x = value;
    }



    drawTrunk(){
        ctx.fillStyle = this.trunkColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    drawLeaves(){
        ctx.fillStyle = this.leavesColor;
        ctx.beginPath();
        for(let leavesCount = 1; leavesCount <= NUMLEAVES; leavesCount++){
            const k = Math.random() * 0.75 + 1.5;
            const i = leavesCount - 1;

            // x positioning of the leaves :
            if(this.leavesX[i] === null){
                this.leavesX[i] = (leavesCount <= NUMLEAVES/2) ? this.x + 2/NUMLEAVES * this.width * leavesCount : this.x + 2/NUMLEAVES * this.width * (leavesCount - NUMLEAVES/2);
            }
            // y
            if(this.leavesY[i] === null){
                this.leavesY[i] = (leavesCount <= NUMLEAVES/2) ? this.y : this.y - this.radius;
            }
            // radius
            if(this.leavesRadius[i] === null){
                this.leavesRadius[i] = k * this.radius;
            }

            ctx.arc(this.leavesX[i], this.leavesY[i], this.leavesRadius[i], 0, Math.PI * 2); 
            ctx.fill();
        }
    }

    update(){
        this.x -= TREESPEED * delta;
        
        if(!started) return;

        for (let i = 0; i < this.leavesX.length; i++) {
            this.leavesX[i] -= TREESPEED * delta;
        }
    }

    draw(){
        this.drawTrunk();
        this.drawLeaves();
    }

}

class Cloud{
    constructor(){
        this.k = Math.random();
        this._x = 1.2 * canvas.width;
        this.circlesColor = `rgba(232, 232, 232, ${Math.random() * 0.2 + 0.8})`;
        this.circlesX = Array(NUMCIRCLES).fill(null);
        this.circlesY = Array(NUMCIRCLES).fill(null);
        this.circlesRadius = Array(NUMCIRCLES).fill(null);
        cloudArray.push(this);
    }

    // I STILL NEED TO CHANGE LEAVES RADIUS AND Y POSITIONS ON RESIZE (USING GETTERS AND SETTERS)

    get width(){
        return this.k * 0.02 * canvas.height + 0.02 * canvas.height;
    }
    get radius(){
        return this.width/2;
    }
    get height(){
        return 5 * this.width;
    }
    get y(){
        return 0.1 * canvas.height;
    }

    get x(){
        return this._x;
    }
    set x(value){
        this._x = value;
    }

    draw(){
        ctx.fillStyle = this.circlesColor;
        ctx.beginPath();
        for(let circlesCount = 1; circlesCount <= NUMCIRCLES; circlesCount++){
            const k = Math.random() * 0.75 + 1.5;
            const i = circlesCount - 1;

            // x positioning of the circles :
            if(this.circlesX[i] === null){
                this.circlesX[i] = (circlesCount <= NUMCIRCLES/2) ? this.x + 2/NUMCIRCLES * this.width * circlesCount : this.x + 2/NUMCIRCLES * this.width * (circlesCount - NUMCIRCLES/2);
            }
            
            // y
            if(this.circlesY[i] === null){
                this.circlesY[i] = (circlesCount <= NUMCIRCLES/2) ? this.y : this.y - this.radius;
            }
            // radius
            if(this.circlesRadius[i] === null){
                this.circlesRadius[i] = k * this.radius;
            }

            ctx.arc(this.circlesX[i], this.circlesY[i], this.circlesRadius[i], 0, Math.PI * 2); 
            ctx.fill();
        }
    }

    update(){
        this.x -= CLOUDSPEED * delta;
        
        if(!started) return;

        for (let i = 0; i < this.circlesX.length; i++) {
            this.circlesX[i] -= CLOUDSPEED * delta;
        }
    }

}



const turkeyBoss = {
        _x: 0.025 * canvas.width,
        _y: 0.16 * canvas.height,// 250 = this.height
        img: document.getElementById("turkeyBossGif"),
        preparingBossTimer: undefined,
        endingBossTimer: undefined,
        gobbleTimer : undefined,
        isJumping: false,
        isFalling: false,
        height: 250,
        width: 250,
        timeSinceLastMove: 0,
        nextMoveDelay: 200,


    get x(){
        return this._x;
    },
    set x(value){
        this._x = value;
    },

    get y(){
        return this._y;
    },
    set y(value){
        this._y = value;
    },

    update(){
        this.timeSinceLastMove += delta;
        this.y = 0.16 * canvas.height;

        this.img.style.bottom = `${this.y}px`;

        if(this.timeSinceLastMove >= this.nextMoveDelay){
            this.timeSinceLastMove = 0;
            this.nextMoveDelay = 200;
            this.x += Math.random() * 10 - 5;
        }
        
        this.img.style.right = `${this.x}px`;
    },
    

    // jump(){
    //     if(this.y > 100){
    //         this.y -= Math.random() * 5;
    //     } else if(this.y <= 100){
    //         this.isFalling = true;
    //     } else if(this.isFalling && this.y < groundLine){
    //         this.y += 5;
    //     }
    // }
}





class BossWeapon{
    constructor(type=null){
        const weaponImg = new Image();
        weaponImg.src = "./boss/chicken-drumstick-cartoon.webp";

        this.img = weaponImg;
        this._x = 1.2 * canvas.width;//canvas.width + this.width
        this.y = Math.round(Math.random() * 6)/10 * canvas.height;
        this.width = Math.random() * 0.035 * canvas.width + 75;
        this.radius = this.width/2;
        this.height = this.width;
        // I approximated the drumstick to be 3 circles and here are the coordinates of their center points and their radius
        this.hitboxes = [{x: this.x + 0.26 * this.width, y: this.y + 0.5 * this.height, radius: 0.26 * this.height},// meat1
                         {x: this.x + 0.66 * this.width, y: this.y + 0.42 * this.height, radius: 0.11 * this.height},// meat2
                         {x: this.x + 0.80 * this.width, y: this.y + 0.38 * this.height, radius: 0.06 * this.height},
                         {x: this.x + 0.9 * this.width, y: this.y + 0.43 * this.height, radius: 0.085 * this.height},
                         {x: this.x + 0.85 * this.width, y: this.y + 0.32 * this.height, radius: 0.05 * this.height},];
                                                                    

        weaponImg.onload = () => {
            bossWeaponArray.push(this); 
            };        
            //RISKY I SHOULDN'T DO THIS (onload...), INSTEAD I SHOULD USE THE FOLLOWING CODE SOMEWHERE ELSE 👹👹👹👹👹👹👹👹
            // if (bossWeaponImg.complete) {
            //     bossWeaponArray.push(new BossWeapon());
            // }
            
      
    }

    get x(){
        return this._x;
    }
    set x(value){
        this._x = value;
    }

    draw(){
        const trimX = 21;
        const trimY = 40;
        
        //The result is that it crops ${trim}px from each side.
        ctx.drawImage(
            this.img,

            // source rectangle (inside the image)
            // trimX, trimY, // sx, sy
            // this.img.width  - trimX * 2, this.img.height - trimY * 2, // sWidth, sHeight

            // destination rectangle (on the canvas)
            this.x, this.y, // dx, dy
            this.width, this.height // dWidth, dHeight  
        );
    }

    update(){
        this.x -= BOSSWEAPONSPEED * delta;
        this.hitboxes[0].x = this.x + 0.26 * this.width;
        this.hitboxes[1].x = this.x + 0.66 * this.width;
        this.hitboxes[2].x = this.x + 0.86 * this.width;
        this.hitboxes[3].x = this.x + 0.9 * this.width;
        this.hitboxes[4].x = this.x + 0.85 * this.width;
    }

}


///////////////////////////////////////////////////////🌳 ELEMENTS 👹 FUNCTIONS 🌥️///////////////////////////////////////////////////////


function updateElts(...elts){
  
    let eltArray;

    for(let i = 0; i < elts.length; i++){
        const eltType = elts[i];

        if(eltType === "trees"){
            eltArray = treeArray;
        }
        else if(eltType === "clouds"){
            eltArray = cloudArray;
        }
        else if(eltType === "bossWeapons"){
            eltArray = bossWeaponArray;
        }

        if(eltArray.length === 0) continue;//skips this iteration

        for(let i = eltArray.length - 1; i >= 0; i--){
            const elt = eltArray[i];

            elt.update();

            //handle removals
            if(elt.x < -2 * elt.width){
                eltArray.splice(i, 1);
            }
        };
    }
   
}

function addNewElts(...elts){

    if(!started) return;

    for(let i = 0; i < elts.length; i++){
        let eltType = elts[i];
        let timeSinceLastElt;
        let nextEltDelay;
        let elt;

        if(eltType === "trees"){
            timeSinceLastElt = timeSinceLastTree;
            timeSinceLastTree += delta;
            nextEltDelay = nextTreeDelay;
            elt = Tree;
        }
        else if(eltType === "clouds"){
            timeSinceLastElt = timeSinceLastCloud;
            timeSinceLastCloud += delta;
            nextEltDelay = nextCloudDelay;
            elt = Cloud;
        }
        else if(eltType === "bossWeapons"){
            timeSinceLastWeapon += delta;
            timeSinceLastElt = timeSinceLastWeapon;
            nextEltDelay = nextWeaponDelay;
            elt = BossWeapon;
        }
        
        if(timeSinceLastElt >= nextEltDelay){
            new elt();

            if(eltType === "trees"){
                treeCount++;
                updateHue();
                timeSinceLastTree = 0;
                nextTreeDelay = randomDelayTrees();
            }
            else if(eltType === "clouds"){
                timeSinceLastCloud = 0;
                nextCloudDelay = randomDelayClouds();
            }
            else if(eltType === "bossWeapons"){
                weaponCount++;
                timeSinceLastWeapon = 0;
                nextWeaponDelay = randomDelayWeapons();
            }
        }  
    }

}


/////////////////////////////////////////////////⏰ DELAY FUNCTIONS ⏰///////////////////////////////////////////////////////

function randomDelayTrees() {
    return Math.random() * 700 + 800;
}

function randomDelayClouds() {
    return Math.random() * 2000 + 1500;
}

function randomDelayWeapons(){
    return Math.random() * 500 + 500;
}

/////////////////////////////////////////////////🐝 THE BEE 🐝///////////////////////////////////////////////////////

const bee = {

    _x: canvas.width,
    y: 0,
    width: beeGif.offsetWidth,
    img: beeGif,
    isReady: false,

    get x(){
        return this._x;
    },
    set x(value){
        this._x = value;
    },



    update() {
        if(momentOfTheDay === "day" && this.x > -this.width && this.isReady){
            this.x -= BEESPEED * delta;
            this.y += Math.trunc(Math.random() * 5)/ 1000 * delta;
        }
        else if(this.x <= -2 * this.width){
            this.x = canvas.width;
            this.isReady = false;
            bee.img.style.display = "none";
        }
   
    },
    draw(){
        if(momentOfTheDay !== "day" || !bee.isReady) return;
        bee.img.style.display = "block";
        bee.img.style.transform = `translate(${this.x}px, ${this.y}px)`;
    },
}




/////////////////////////////////////////////////🏓 THE GAME ENVIRONMENT BEFORE THE START 🏓///////////////////////////////////////////////////////


function drawElementsBeforeStart(...elts) {

    for(let i = 0; i < elts.length; i++){
        const eltType = elts[i];
        let numEltsBeginning;
        let ClassName;
        

        if(eltType === "clouds"){
            numEltsBeginning = 3;
            ClassName = Cloud;
        }
        else if(eltType === "trees"){
            numEltsBeginning = 2;
            ClassName = Tree;
        }

        for(let j = 0; j < numEltsBeginning; j++){

            const elt = new ClassName();

            if(j === 0){
                if(eltType === "clouds") elt.x = 0.25 * canvas.width;
                if(eltType === "trees") elt.x = 0.5 * canvas.width;
            }
            if(j === 1){
                if(eltType === "clouds") elt.x = 0.5 * canvas.width;
                if(eltType === "trees") elt.x = 0.75 * canvas.width;
            }
            if(j === 2 && eltType === "clouds"){
                elt.x = 0.75 * canvas.width;
            }
            elt.draw();
        }
    }


}

///////////////////////////////////////////////////////🎮 THE GAME ENVIRONMENT 🎮///////////////////////////////////////////////////////


function updateEnvironment(time) {

    if(!started) return;
    
    delta = time - lastTime;
    lastTime = time;
    
    recalcAltitudes();
    basket.update();
    handleScoreSoundEffect();
    if(bee.isReady) bee.update();
        
    updateElts("trees", "clouds", "bossWeapons");

    if(bossState === "active"){
        turkeyBoss.update();
        addNewElts("bossWeapons");
    } else {
        addNewElts("trees");
        setDayTime();
    }

    addNewElts("clouds");
    


    lastScore = score;
}


function drawEnvironment(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // SKY :
    const gradient = ctx.createLinearGradient(0, 0, 0, groundLine);

    //from 0% to 20% the sky is blue, then from 20% to 100% there's a gradient from blue to white.
    gradient.addColorStop(0, "rgba(26, 209, 255, 1)");
    gradient.addColorStop(0.2, "rgba(26, 209, 255, 1)");
    gradient.addColorStop(1, "white");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, groundLine);


    // GROUND :

    ctx.fillStyle = "rgba(55, 152, 9, 1)";
    ctx.fillRect(0, groundLine, canvas.width, (1 - HEIGHTPROPORTION) * canvas.height);
    


    // DRAW ELEMENTS
    balloon.draw();
    treeArray.forEach((_,i) => {
        treeArray[i].draw();
    });
    cloudArray.forEach((_,i) => {
        cloudArray[i].draw();
    });
    if(bossState === "active"){
        bossWeaponArray.forEach((_,i) => {
            bossWeaponArray[i].draw();
        });
    }

    bee.draw();


    updateDisplayScore();

}


///////////////////////////////////////////////////////🔚 PREPARE/START/END 💫///////////////////////////////////////////////////////

function prepareGame(){

    removePreviousFilters();

    wantsToFly = false;

    started = false;
    ended = false;

    score = 0;
    lastScore = 0;

    delta = 0;
    lastTime = 0;

    treeArray = [];
    timeSinceLastTree = 0;
    nextTreeDelay = randomDelayTrees();
    treeCount = 0;

    cloudArray = [];
    timeSinceLastCloud = 0;
    nextCloudDelay = randomDelayClouds();

    bee.isReady = false;

    hue = 0;

    bossState = "inactive";
    timeSinceLastWeapon = 0;
    bossWeaponArray = [];
    weaponCount = 0;
    nextWeaponDelay = randomDelayWeapons();

    setDayTime();

    recalcAltitudes();
    
    basket.width = 0.125 * canvas.height;
    basket.y = groundLine - basket.height;

    restartBtn.style.display = "none";
    topAdvice.style.display = "block";
    startTag.style.display = "flex";
    startTag.classList.remove("startAnimation");
    startTag.textContent = "READY ?";
    startTag.classList.add("waitingToStart");

    drawEnvironment();
    drawElementsBeforeStart("trees", "clouds");
}

function startGame() {
    started = true;
    //it erases the trees and the clouds that were on the screen before the start
    treeArray = [];
    cloudArray = [];

    startTag.classList.remove("waitingToStart");
    startTag.textContent = "🌳 GO ! 🎈";
    startTag.classList.add("startAnimation");
    
    startTag.addEventListener("animationend", () => {
        startTag.textContent = "";
        startTag.style.display = "none";
    }, {once:true})

    setTimeout(() => {
        topAdvice.style.display = "none";
    }, 10000);

    playMusic();

    requestAnimationFrame(gameLoop);
}

function endGame() {
    ended = true;
    wantsToFly = false;

    clearTimeout(turkeyBoss.preparingBossTimer);
    clearTimeout(turkeyBoss.endingBossTimer);
    clearTimeout(turkeyBoss.gobbleTimer);

    removeEverythingFromTheMiddle();
    stopAllMusic();
    failSoundEffect.play();

    restartBtn.style.display = "flex";
}

restartBtn.addEventListener("click", prepareGame);

///////////////////////////////////////////////////////🌞 DAY AND NIGHT 🌚///////////////////////////////////////////////////////

function setDayTime(){

    if(!started){
        momentOfTheDay = "day";
        hue = 0;
        canvas.style.filter = "none";
        return;
    }

2
    if(score === lastScore) return;
    

    if(momentOfTheDay === "day"){
        canvas.style.filter = `hue-rotate(${hue}deg)`;

        if(score % DAYTIMELIMIT === 0){
            momentOfTheDay = "night";
            nightComing.style.display = "block";
            nightComing.classList.add("nightComin");

            nightComing.addEventListener("animationend", () => {
                nightComing.style.display = "none";
                nightComing.classList.remove("nightComin"); 
            }, {once:true});

            canvas.style.filter = "invert()";
            playMusic();
        }
    }
    else if(momentOfTheDay === "night" && score % DAYTIMELIMIT === 0){
        momentOfTheDay = "day";
        bee.isReady = true;
        hue = 0;
        canvas.style.filter = `hue-rotate(0deg)`;
        playMusic();
    }
}

///////////////////////////////////////////////////////➰ GAME LOOP ➰///////////////////////////////////////////////////////


//The 'time' argument is given by the requestAnimationFrame function
function gameLoop(time){

    updateEnvironment(time);

    drawEnvironment();

    handleBoss();


    if(bossState === "active"){
        checkCollisionsBoss(); 
    }
    
    checkCollisionsWithElts("tree");
    
    if(!ended) requestAnimationFrame(gameLoop);
}

///////////////////////////////////////////////////////💥 CRASH HANDLERS 💥///////////////////////////////////////////////////////


//I could add the rail for more precision but if a tree touches the rail it touches the cables
const balloonSquareLikeElts = [basket, cable1, cable2];

function checkCollisionsWithElts(eltType) {

    let eltArray;

    if(eltType === "tree") eltArray = treeArray;

    if(eltArray.length === 0) return;

    let eltsRanges = getEltsRanges(eltArray);

    for(let i = 0; i < eltsRanges.length; i++){
        const eltRange = eltsRanges[i];
        const eltRangeX = eltRange[0];
        const eltRangeY = eltRange[1];

        const eltMinX = eltRangeX[0];
        const eltMaxX = eltRangeX[1];
        const eltMinY = eltRangeY[0];
        const eltMaxY = eltRangeY[1];

        for(let i = 0; i < balloonSquareLikeElts.length; i++){
            const balloonEltRange = getBalloonEltRange(i);

            const balloonEltRangeX = balloonEltRange[0];
            const balloonEltRangeY = balloonEltRange[1];

            const balloonEltMinX = balloonEltRangeX[0];
            const balloonEltMaxX = balloonEltRangeX[1];
            const balloonEltMinY = balloonEltRangeY[0];
            const balloonEltMaxY = balloonEltRangeY[1];

            if(eltMinX < balloonEltMaxX &&
            eltMaxX > balloonEltMinX &&
            eltMinY < balloonEltMaxY &&
            eltMaxY > balloonEltMinY){
                return endGame();
            }
        }
    }
}


function getEltsRanges(eltArray) {

    if(eltArray.length === 0) return;

    let eltsRanges = [];

    for(let i = 0; i < eltArray.length; i++){
        const elt = eltArray[i];        
        if(elt.x > basket.x - elt.width){
            //elt.x and elt.y are the coordinates of the top left corner of the elt

            const topLeftCornerX = elt.x;
            const topRightCornerX = elt.x + elt.width;

            const topLeftCornerY = elt.y;
            const bottomLeftCornerY = elt.y + elt.height;


            // let rangeX = (x >= topLeftCornerX && x <= topRightCornerX);
            // let rangeY = (y >= topLeftCornerY && y <= bottomLeftCornerY);

            eltsRanges.push( [[topLeftCornerX, topRightCornerX], [topLeftCornerY, bottomLeftCornerY]] )
            
        }
    }
    return eltsRanges;
}

function getBalloonEltRange(i) {
    const elt = balloonSquareLikeElts[i];

    //elt.x and elt.y are the coordinates of the top left corner of the elt

    const topLeftCornerX = elt.x;
    const topRightCornerX = elt.x + elt.width;

    const topLeftCornerY = elt.y;
    const bottomLeftCornerY = elt.y + elt.height;


    // let eltRangeX = (x >= topLeftCornerX && x <= topRightCornerX);
    // let eltRangeY = (y >= topLeftCornerY && y <= bottomLeftCornerY);

    return [[topLeftCornerX, topRightCornerX], [topLeftCornerY, bottomLeftCornerY]];
}





function circleCollision(a, b) {

    // I assume a.x and a.y are the coordinates of the center point of the circle a. (same for b)

    //first I need to calculate the distance between the two circles centers
    const vectorAB = {
        x : b.x - a.x,
        y: b.y - a.y,
    }
    const distanceAB = Math.sqrt(vectorAB.x ** 2 + vectorAB.y ** 2)

    return distanceAB < a.radius + b.radius;

}


function circleRectangleCollision(circle, rectangle){
    const cx = circle.x;//circle center
    const cy = circle.y;
    const rx = rectangle.x;//top left corner
    const ry = rectangle.y;
    const rw = rectangle.width;
    const rh = rectangle.height;

    const closestX = clamp(cx, rx, rx + rw);
    const closestY = clamp(cy, ry, ry + rh);

    const dx = cx - closestX;
    const dy = cy - closestY;

    const distance = Math.sqrt(dx**2 + dy**2);

    if(distance < circle.radius) return true;
}

//clamp = limit a value to a range (min <= value <= max)
function clamp(value, min, max){
    return Math.min(max, Math.max(value, min));

    //  Same As :
    // if (value < min) return min;
    // if (value > max) return max;
    // return value;
}

function checkCollisionsBoss() {
    for(const weapon of bossWeaponArray){
        for(const hitBox of weapon.hitboxes){
            if(circleCollision(hitBox, envelope)) return endGame();
            for(const balloonSquareLikeElt of balloonSquareLikeElts){
                if(circleRectangleCollision(hitBox, balloonSquareLikeElt)) return endGame();
            }
        }
    }
}

///////////////////////////////////////////////////////👹 BOSS HANDLER 👹///////////////////////////////////////////////////////


function handleBoss() {

    if(score === lastScore) return;

    if(score === BOSSSTART && bossState !== "pending"){

        bossWarningMsg.style.display = "block";

        bossState = "pending";

        turkeyBoss.preparingBossTimer = setTimeout(() => {
            bossState = "active";
            document.body.classList.add("bossModeFilter");
            basket.width = 0.075 * canvas.height;
            playMusic();
            turkeyBoss.img.style.display = "block";
            bossWarningMsg.style.display = "none";
            playRandomTurkeySoundEffect();

            turkeyBoss.gobbleTimer = setTimeout(() => {
                playRandomTurkeySoundEffect();
            }, BOSSFIGHTDURATION/4);

            turkeyBoss.endingBossTimer = setTimeout(() => {
                endBossMode();
            }, BOSSFIGHTDURATION);

        }, 2000)
    }
}

function playRandomTurkeySoundEffect(){
    const i = Math.trunc(Math.random() * turkeySoundEffects.length);
    turkeySoundEffects[i].play();
}



function endBossMode(){
    document.body.classList.remove("bossModeFilter");
    turkeyBoss.img.style.display = "none";
    basket.width = 0.125 * canvas.height;//we put the balloon back to its normal width
    basket.y = groundLine - basket.height;//ensures that the balloon is correctly positioned on the y axis
    bossState = "inactive";
    playMusic();
}
///////////////////////////////////////////////////////👨‍🔬 USEFUL FUNCTIONS 👨‍🔬///////////////////////////////////////////////////////

function updateHue(){
    if(momentOfTheDay !== "day") return;

    if(hue < HUELIMIT){
        hue += HUELIMIT/(DAYTIMELIMIT/SCORECONSTANT);
    }
    else{hue = 0}
}

function recalcAltitudes(){
    // maxAltitude = 0.25 * canvas.height + BALLOONSPEED * delta;
    maxAltitude = cable1.height + envelope.radius * 1.6 + BALLOONSPEED * delta;
    midAltitude = 0.5 * canvas.height;
    groundLine = HEIGHTPROPORTION * canvas.height;
}

//this function is useful in case a message is being displayed on the middle of the screen when I hit a tree
function removeEverythingFromTheMiddle(){
    nightComing.style.display = "none";
    bee.img.style.display = "none";
    turkeyBoss.img.style.display = "none";
    bossWarningMsg.style.display = "none";
    startTag.style.display = "none";
}

function removePreviousFilters(){
    document.body.classList.remove("bossModeFilter");
}

///////////////////////////////////////////////////////💯 SCORE HANDLERS 💯///////////////////////////////////////////////////////

function updateDisplayScore() {
    score = SCORECONSTANT * treeCount + (weaponCount * SCORECONSTANT);

    scoreDisplay.textContent = `Score : ${score}`;
}

function handleScoreSoundEffect(){
    if(score > 0 && score % 100 === 0 && lastScore !== score){
        ptsSoundEffect.volume = 0.75;
        ptsSoundEffect.currentTime = 0;
        ptsSoundEffect.play();
    }
}

///////////////////////////////////////////////////////🎶 MUSICS 🎶///////////////////////////////////////////////////////

function playMusic(){

    if(!started) return;

    stopAllMusic();

    let music;
    if(bossState === "active") music = gameMusicBoss;
    else if(momentOfTheDay === "night") music = gameMusicNight;
    else if(momentOfTheDay === "day") music = gameMusicDay;
    music.currentTime = 0;
    music.loop = true;
    music.play();
}

function stopAllMusic(){
    for(const music of MUSICARRAY){
        music.pause();
    }
}


///////////////////////////////////////////////////////👾 START GAME HANDLERS 👾///////////////////////////////////////////////////////

                // space bar
document.addEventListener("keydown", event => {
    if(event.key === " ") {
        if(!falling) wantsToFly = true;
        if(!started && !ended){
            startGame();
        }
    }
})
document.addEventListener("keyup", event => {
    if(event.key === " ") wantsToFly = false;
})

                // mouse
document.addEventListener("mousedown", () => {
    if(!falling) wantsToFly = true;
    if(!started && !ended) startGame();
})
document.addEventListener("mouseup", () => {
    wantsToFly = false;
})


////////////////////////////////////////////

prepareGame();

///////////////////////////////////////////




///////////////////////////////////////////////////////📜 DRAFTS 📜///////////////////////////////////////////////////////


document.querySelector("footer").addEventListener("click", () => {
    stopAllMusic();
})



// class GameBoss{
//     constructor(){
//         const gameBossImg = new Image();
//         gameBossImg.src = "./boss/turkey.gif";

//         this._x = groundLine;
//         this._y = 250;
//         this.img = gameBossImg;
//         this.isJumping = false;
//         this.isFalling = false;
//         this.height = 250;
//         this.width = 250;

//         this.imgLoaded = false;

//         gameBossImg.onload = () => {
//             this.imgLoaded = true;
//             };
//     }

//     get x(){
//         return this._x;
//     };
//     set x(value){
//         this._x = value;
//     };

//     get y(){
//         return this._y;
//     };
//     set y(value){
//         this._y = value;
//     };

//     update(){
//         this.x += Math.random() * 4 - 2;
//     };

//     draw(){
//         // console.log(this.imgLoaded);

//         if(this.imgLoaded){
//             console.log("yes");
//         ctx.drawImage(
//             this.img,
//             0.75 * canvas.width,
//             groundLine - this.height,
//             this.width,
//             this.height
//         )}
//     };


//     jump(){
//         if(this.y > 100){
//             this.y -= Math.random() * 5;
//         } else if(this.y <= 100){
//             this.isFalling = true;
//         } else if(this.isFalling && this.y < groundLine){
//             this.y += 5;
//         }
//     }
// }

