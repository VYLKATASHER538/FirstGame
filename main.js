class LevelGenerator {
    constructor(scene, tilemapKey, tilesetKey, tileSize = 16, width = 1000, height = 1000) {
        this.scene = scene;
        this.tileSize = tileSize;
        this.width = width;
        this.height = height;
        this.map = this.scene.make.tilemap({ width, height, tileWidth: tileSize, tileHeight: tileSize });
        this.tileset = this.map.addTilesetImage(tilemapKey, tilesetKey);
        this.layer = this.map.createBlankLayer("World", this.tileset, 0, 200);
        this.generateLevel();

        this.map.setCollisionByExclusion([-1], true, this.layer);
        this.layer.setScale(2)
    }

    generateLevel() {
        let levelData = this.generateTerrain();
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let tileIndex = levelData[y][x];
                if (tileIndex !== -1) {
                    this.layer.putTileAt(tileIndex, x, y);  
                }
            }
        }
    }

    generateTerrain() {
        let data = Array.from({ length: this.height }, () => Array(this.width).fill(-1));

        const TILE_DIRT = 16;
        const TILE_GRASS = 0;
        const TILE_WATER = 192;
        const TILE_STONE = 8;
        const TILE_TREE = 49;
        const TILE_TREE_TALL_ONE = 80;
        const TILE_TREE_TALL_TWO = 64;
        const TILE_TREE_TALL_THREE = 48;

        let terrainHeights = Array(this.width).fill(0).map((_, x) => Math.floor(Phaser.Math.Between(11, 13) + Math.sin(x * 0.3) * Phaser.Math.Between(1, 5)));

        for (let x = 0; x < this.width; x++) {
            let groundHeight = terrainHeights[x];

            for (let y = groundHeight; y < this.height; y++) {
                data[y][x] = TILE_DIRT;
            }

            if (groundHeight < this.height) {
                data[groundHeight][x] = TILE_GRASS;

                if (Math.random() < 0.2) {
                    data[groundHeight - 1][x] = TILE_TREE;
                }
                if (Math.random() < 0.2) {
                    data[groundHeight - 1][x] = TILE_TREE_TALL_ONE;
                    data[groundHeight - 2][x] = TILE_TREE_TALL_TWO;
                    data[groundHeight - 3][x] = TILE_TREE_TALL_THREE;
                }
            }

            for (let y = groundHeight + Phaser.Math.Between(15, 20); y < this.height; y++) {
                if(Math.random() < 0.999){
                    data[y][x] = TILE_STONE;
                }
            }
        }

        for(let i=0; i<10; i++){
            let waterStart = Phaser.Math.Between(5, this.width - 15);
            let waterWidth = Phaser.Math.Between(5, 10);
            for (let x = waterStart; x < waterStart + waterWidth; x++) {
                let waterHeight = terrainHeights[x] + Phaser.Math.Between(0, 3);
                for (let y = waterHeight; y < waterHeight + 3; y++) {
                    if (y < this.height) {
                        data[y][x] = TILE_WATER;
                    }
                }
            }
        }

        for(let i=0; i<5; i++){
            let groundWaterStart = Phaser.Math.Between(5, this.width - 15);
            let groundWaterWidth = Phaser.Math.Between(15, 25);
            for (let x = groundWaterStart; x < groundWaterStart + groundWaterWidth; x++) {
                let groundWaterHeight = terrainHeights[x] + Phaser.Math.Between(50, 53);
                for (let y = groundWaterHeight; y < groundWaterHeight + 3; y++) {
                    if (y < this.height) {
                        data[y][x] = TILE_WATER;
                    }
                }
            }
        }

        return data;
    }
}

class Player extends Phaser.Physics.Arcade.Sprite{
    constructor(scene, x, y){
        super(scene, x, y, "hero");
        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.world.enable(this);
        this.countOfJump = 0;
        this.timeOfFly = 0;
        this.setBounce(0);

        this.setScale(1.5).refreshBody()

        this.createAnimations();
    }

    createAnimations(){
        this.anims.create({
            key: "walk",
            frames: this.anims.generateFrameNumbers("hero", {start: 16, end: 19}),
            frameRate: 10,
            repeat: -1  
        })
    
        this.anims.create({
            key: "turn",
            frames: this.anims.generateFrameNumbers("hero", {start: 0, end: 1}),
            frameRate: 2
        })
    
        this.anims.create({
            key: "run",
            frames: this.anims.generateFrameNumbers("hero", {start: 24, end: 31}),
            frameRate: 10,
            repeat: -1
        })


    
        this.anims.create({
            key: "attack",
            frames: this.anims.generateFrameNumbers("hero", {start: 64, end: 71}),
            frameRate: 10,
        })

        this.anims.create({
            key: "death",
            frames: this.anims.generateFrameNumbers("hero", {start: 55, end: 63}),
            frameRate: 10,
        })
    }

    update(cursors, a_key, d_key, justDownSpace){
        if(this.timeOfFly == 0){
            if(this.body.blocked.down){
                this.countOfJump = 0
            }
            if(justDownSpace && this.countOfJump < 2)
            {
                this.countOfJump++
                this.setVelocityY(-500)
            }
        }
        else if(this.timeOfFly != 0){
            this.timeOfFly--
            if(cursors.space.isDown){
                this.setVelocityY(-500)
            }
        }
    
        if(cursors.left.isDown || a_key.isDown)
        {
            if(cursors.shift.isDown){
                this.speed = 1.5
                this.setVelocityX(-200 * this.speed)
                this.anims.play("run", true)
            }else{
                this.speed = 1
                this.setVelocityX(-200 * this.speed)
                this.anims.play("walk", true)
            }
            this.setFlipX(true)
        }
        else if(cursors.right.isDown || d_key.isDown)
        {
            if(cursors.shift.isDown){
                this.speed = 1.5
                this.setVelocityX(200 * this.speed)
                this.anims.play("run", true)
            }else{
                this.speed = 1
                this.setVelocityX(200 * this.speed)
                this.anims.play("walk", true)
            }
            this.setFlipX(false)
        }
        else
        {
            this.setVelocityX(0)
            this.anims.play("turn", true)
        }
    }
}

class Mob extends Phaser.Physics.Arcade.Sprite{
    constructor(scene, x, y){
        super(scene, x, y, "dude");
        this.scene = scene;
        this.scene.add.existing(this);
        this.start = true
        this.dist = 1000   
        this.scene.physics.world.enable(this);
        this.countOfJump = 0;
        this.timeOfFly = 0;
        this.setBounce(0);
        this.setCollideWorldBounds(true);

        this.createAnimations();    
    }
    update(){
        if(this.start){
            this.start_x = this.body.position.x
            this.scene.add.existing(this);
            this.scene.physics.world.enable(this);

            this.setCollideWorldBounds(true)
            this.setVelocityX(-150)
            this.anims.play("left_enemy", true)
            this.start = false
        }
        if(this.body.position.x >= this.start_x + this.dist || this.x >= 4125 || this.body.touching.right){
            this.setVelocityX(-150)
            this.anims.play("left_enemy", true)
        }
        else if(this.body.position.x <= this.start_x - this.dist || this.x <= 0 || this.body.touching.left){
            this.setVelocityX(150)
            this.anims.play("right_enemy", true)
        }
    }
    createAnimations(){
        this.anims.create({
            key: "left_enemy",
            frames: this.anims.generateFrameNumbers("dude", {start: 0, end: 3}),
            frameRate: 10,
            repeat: -1  
        })
    
        this.anims.create({
            key: "turn_enemy",
            frames: [{key: "dude", frame: 4}],
            frameRate: 20
        })
    
        this.anims.create({
            key: "right_enemy",
            frames: this.anims.generateFrameNumbers("dude", {start: 5, end: 8}),
            frameRate: 10,
            repeat: -1
        })
    }
}

class Mobs extends Phaser.Physics.Arcade.Group{
    constructor(scene){
        super(scene.physics.world, scene);
    }
}

class Bomb extends Phaser.Physics.Arcade.Sprite{
    constructor(scene, x, y){
        super(scene, x, y, "bomb");
    }

    fire(){
        this.setActive(true);
        this.setVisible(true);

        this.scene.add.existing(this);
        this.scene.physics.world.enable(this);

        this.setBounce(1)
        this.setCollideWorldBounds(true)
        this.setVelocity(Phaser.Math.Between(-200, 200), 20)
    }
}

class Bombs extends Phaser.Physics.Arcade.Group{
    constructor(scene){
        super(scene.physics.world, scene);
    }
}

class Bullet extends Phaser.Physics.Arcade.Sprite{
    constructor(scene, x, y){
        super(scene, x + 20, y + 35, "bullet");
    }

    shoot(player){
        this.setActive(true);
        this.setVisible(true);
        this.body.setAllowGravity(false)
        this.scene.add.existing(this);
        this.scene.physics.world.enable(this);

        this.setVelocityX(200);
    }
}

class Bullets extends Phaser.Physics.Arcade.Group{
    constructor(scene){
        super(scene.physics.world, scene);
        this.magazineSize = 0;
    }
}

class GameScene extends Phaser.Scene{
    constructor(){
        super("GameScene")
        this.player = null;
        this.mob = null
        this.stars = null;
        this.bombs = null;
        this.mobs = null;
        this.wings = null;
        this.bullets = null;
        this.score = 0;
        this.cursors;
        this.a_key;
        this.d_key;
        this.endGame;
        this.button = null;
        this.mob_speed;
        this.countOfJump = 0;
        this.score = 0;
        this.speed = 1;
        this.gameover = false;
        this.scoreText;
        this.mobs;
        this.marker;
        this.objectToPlace = 'grass';
        this.inventory = [];
    }
    
    preload(){
        this.load.image("sky", "assets/sky.png")
        this.load.image("star", "assets/star.png")
        this.load.image("bomb", "assets/bomb.png")
        this.load.image("button", "assets/button.png")
        this.load.image("Fan", "assets/Fan.png")
        this.load.image("bullet", "assets/bullet.png")
        this.load.spritesheet("dude", "assets/dude.png", {frameWidth: 32, frameHeight: 48})
        this.load.spritesheet("hero", "assets/animations_hero.png", {frameWidth: 32, frameHeight: 32})

        this.load.image("tiles", "assets/tileset.png");
        this.load.image("tilesNew", "assets/world_tileset.png");

        this.load.audio("bgMusic", "assets/bgMusic.wav")
    }
        
    create(){
        this.bgMusic = this.sound.add('bgMusic');
        this.bgMusic.loop = true;
        this.bgMusic.play();

        this.cursors = this.input.keyboard.createCursorKeys();

        this.a_key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.d_key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    
        this.add.image(config.width/2, config.height/2, "sky").setScale(1000, 5)
    
        this.scoreText = this.add.text(16, 16, "Score: 0", {fontSize: "32px", fill: "#000"}).setScrollFactor(0)
        
        this.level = new LevelGenerator(this, "tilesNew", "tilesNew")

        this.marker = this.add.graphics();
        this.marker.lineStyle(2, 0x000000, 1);
        this.marker.strokeRect(0, 0, this.level.map.tileWidth * this.level.layer.scaleX, this.level.map.tileHeight * this.level.layer.scaleY);

        this.wings = this.physics.add.group();
        this.mobs = new Mobs(this)
    
        this.player = new Player(this, this.level.width*16, 100)
    
        this.stars = this.physics.add.group({
            key : "star",
            frameQuantity : 3,
        });
    
        this.stars.children.iterate((child) => {
            child.setBounce(0.4)
            child.setCollideWorldBounds(true)
        })
    
        const rect = new Phaser.Geom.Rectangle(0, 50, 4150, 400)
        
        Phaser.Actions.RandomRectangle(this.stars.getChildren(), rect)
    
        this.bombs = new Bombs(this)
        this.bullets = new Bullets(this)

        const {centerX, centerY} = this.cameras.main
        
        const menu = this.add.container(centerX, centerY)

        this.endGame = this.add.text(0, 0, "Вы\nпогибли", {fontSize: 64, fill: "#000"}).setAlign("center").setVisible(false).setScrollFactor(0).setOrigin(0.5, 1)
        this.button = this.add.image(0, 0, "button").setVisible(false).setScrollFactor(0).setOrigin(0.5, 0)

        menu.add(this.endGame)
        menu.add(this.button)


        const inventory_label = ["dude", "bomb", "star"];
        for(let i = 0; i < inventory_label.length; i++){
            const elem = this.add.image(50 * i, 0, inventory_label[i]);
            this.inventory.push(elem)
        }
        this.cur_elem = this.add.graphics();
        this.cur_elem.lineStyle(2, 0x000000, 1);
        this.cur_elem.strokeRect(this.inventory[1].x - this.inventory[1].width / 2, this.inventory[1].y - this.inventory[1].height / 2, this.inventory[1].width, this.inventory[1].height);
        
        const inventory_container = this.add.container(50, 100).setScrollFactor(0)
        inventory_container.add(this.cur_elem)

        for(let i = 0; i < this.inventory.length; i++){
            inventory_container.add(this.inventory[i])
        }

    
        this.button.setInteractive()
    
        this.button.on("pointerdown",
            () => {
                this.physics.resume()
                this.player.clearTint()
                this.player.enableBody(true, this.level.width*16, 100, true, true)

                this.player.timeOfFly = 0
    
                this.stars.children.iterate((child) => {
                    child.enableBody(true, child.x, 0, true, true)
                })
    
                const rect = new Phaser.Geom.Rectangle(0, 0, 4150, 450)

        
                Phaser.Actions.RandomRectangle(this.stars.getChildren(), rect)

                this.bombs.clear(true, true)
                this.mobs.clear(true, true)
                this.wings.clear(true, true)
    
                this.score = 0
                this.scoreText.setText("Score: " + this.score)
    
                this.button.setVisible(false)
                this.endGame.setVisible(false)
    
                this.gameover = false
            }
        )
    
        const camera = this.cameras.main;
    
        // camera.setBounds(0, 0, 4150, 600, true, true, true, false)
        // this.physics.world.setBounds(0, 0, 4150, 600, true, true, true, false)
    
        camera.startFollow(this.player);
        camera.setFollowOffset(0, 15);
        camera.setLerp(.05, .05)
    
        this.input.on("pointerdown", () => {
            this.shootBullet()
        })
        
        this.physics.add.collider(this.player, this.level.layer)

        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this)
        this.physics.add.overlap(this.player, this.bombs, this.hitBomb, null, this)
        this.physics.add.overlap(this.player, this.mobs, this.hitBomb, null, this)
        this.physics.add.overlap(this.player, this.wings, this.wingsFly, null, this)
        this.physics.add.overlap(this.mobs, this.bullets, this.hitBullet, null, this)




        this.input.keyboard.on('keydown-ONE', (event) =>
        {
            this.objectToPlace = 'grass';
            this.cur_elem.x = this.inventory[0].x
            // this.cur_elem.width = this.inventory[0].width
            // this.cur_elem.height = this.inventory[0].height
        });

        this.input.keyboard.on('keydown-TWO', (event) =>
        {
            this.objectToPlace = 'dirt';
        });

        this.input.keyboard.on('keydown-THREE', (event) =>
        {
            this.objectToPlace = 'stone';
        });

        this.input.keyboard.on('keydown-FOUR', (event) =>
        {
            this.objectToPlace = 'water';
        });

        this.input.keyboard.on('keydown-FIVE', (event) =>
        {
            this.objectToPlace = 'remove';
        });
    }
        
    update(){
        const justDownSpace = Phaser.Input.Keyboard.JustDown(this.cursors.space)
        this.player.update(this.cursors, this.a_key, this.d_key, justDownSpace)
    
        this.mobs.children.iterate((mob) => {
            mob.update()
        })
        

        if(this.gameover){
            this.endGame.setVisible(true)
            this.button.setVisible(true)
        }



        const worldPoint = this.input.activePointer.positionToCamera(this.cameras.main);

        const pointerTileX = this.level.map.worldToTileX(worldPoint.x);
        const pointerTileY = this.level.map.worldToTileY(worldPoint.y);

        this.marker.x = this.level.map.tileToWorldX(pointerTileX);
        this.marker.y = this.level.map.tileToWorldY(pointerTileY);

        if (this.input.manager.activePointer.isDown){
            switch(this.objectToPlace){
                case 'grass':
                    this.level.map.putTileAt(0, pointerTileX, pointerTileY);
                    break;
                case 'dirt':
                    this.level.map.putTileAt(16, pointerTileX, pointerTileY);
                    break;
                case 'stone':
                    this.level.map.putTileAt(8, pointerTileX, pointerTileY);
                    break;
                case 'water':
                    this.level.map.putTileAt(192, pointerTileX, pointerTileY);
                    break;
                case 'remove':
                    this.level.map.removeTileAt(pointerTileX, pointerTileY);
                    break;
                default:
                    break;
            }
        }
    }
    shootBullet(){
        if(this.bullets.magazineSize > 0){
            this.bullets.magazineSize--;
            var bullet = new Bullet(this, this.player.body.position.x, this.player.body.position.y)
            this.bullets.add(bullet)
            bullet.shoot(this.player)
        }
    }
    collectStar(player, star){
        this.score++
        this.scoreText.setText("Score: " + this.score)
        star.disableBody(true, true)
    
        if(this.stars.countActive(true) == 0)
        {
            this.stars.children.iterate((child) => {
    
                child.enableBody(true, child.x, 0, true, true)
    
            })
            
            const rect = new Phaser.Geom.Rectangle(0, 0, 4150, 450)
            
            Phaser.Actions.RandomRectangle(this.stars.getChildren(), rect)
    
            let x = (this.player.x < 2075) ? Phaser.Math.Between(2075, 4150) : Phaser.Math.Between(0, 2075)

            let bomb = new Bomb(this, x, 16)
            this.bombs.add(bomb)
            bomb.fire()

            let mob = new Mob(this, Phaser.Math.Between(100, 4150), 300)
            this.mobs.add(mob)
    
            let fly = this.wings.create(0, 0, "Fan")
            Phaser.Actions.RandomRectangle(this.wings.getChildren(), rect)

            this.bullets.magazineSize += 5;
        }
    }
    
    hitBomb(player, bomb){
        this.player.setTint("#AA0012")
        this.physics.pause()
    
        this.gameover = true
    }
    
    hitBullet(mob, bullet){
        mob.setTint(0xa11020)
        mob.anims.play("turn")
    
        mob.disableBody(true, false)
    
        mob.scene.tweens.add({
            targets: mob,
            alpha: {
                getStart: () => 1,
                getEnd: () => 0,
            },
            duration: 500,
            ease: "Linear",
            repeat: 2,
            yoyo: true,
            onComplete: () => {mob.disableBody(true, true)}
        })
    
        bullet.destroy()
    }

    wingsFly(player, fly){
        player.timeOfFly = 60 * 15
        fly.destroy(true, true)
    }
}

let config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: "arcade",
        arcade: {
            gravity: {   y : 1000   },
            debug: false
        }
    },

    scene : GameScene,
    fps: 60,
    pixelArt: true,
}

let game = new Phaser.Game(config)