// gameengine object
//
// Author: Jisu Sim
// Date: 2020.05.28
var gameengine = (function() {
    'use strict';

	function getTimestamp() {
        return performance.now();
    }
	
	function GameEngine(outerContainerQuery, className, width, height, game) {
        this.outerContainer = document.querySelector(outerContainerQuery);
        this.canvas = document.createElement('canvas');
        this.canvasCtx = this.canvas.getContext('2d');

        this.width = width;
        this.height = height;
        this.game = game;

        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.classList.add(className);
        this.outerContainer.appendChild(this.canvas);

        document.addEventListener('keydown', this);
        document.addEventListener('keyup', this);
        document.addEventListener('mousedown', this);
        document.addEventListener('mouseup', this);
        document.addEventListener('mousemove', this);
        document.addEventListener('mouseover', this);
		document.addEventListener('mouseout', this);

        this.init();
        this.start();
    }
    GameEngine.prototype = {
        init() {
            this.runningTime = 0;
            this.game.init(this);
        },
        start() {
            this.loop();
        },
        stop() {
            if (this.reqId) cancelAnimationFrame(this.reqId);
            this.reqId = undefined;
            this.prevTime = undefined;
        },
        loop() {
            var curTime = getTimestamp();
            var deltaTime = curTime - (this.prevTime || curTime);
            this.runningTime += deltaTime;
            this.prevTime = curTime;

            this.clearCanvas();
            this.game.update(this, deltaTime);
            this.game.draw(this, this.canvasCtx);
            
            this.reqId = requestAnimationFrame(this.loop.bind(this));
        },
        clearCanvas() {
            this.canvasCtx.clearRect(0, 0, this.width, this.height);
        },
        handleEvent(e) {
            if (e.type == 'keydown') {
                this.onKeyDown(e);
            } else if (e.type == 'keyup') {
                this.onKeyUp(e);
            } else if (e.type == 'mousedown') {
                this.onMouseDown(e);
            } else if (e.type == 'mouseup') {
                this.onMouseUp(e);
            } else if (e.type == 'mousemove') {
                this.onMouseMove(e);
            } else if (e.type == 'mouseover') {
				this.onMouseOver(e);
			} else if (e.type == 'mouseout') {
				this.onMouseOut(e);
			}
        },
        onKeyDown(e) {
            this.game.onKeyDown(e);
        },
        onKeyUp(e) {
            this.game.onKeyUp(e);
        },
        onMouseDown(e) {
            if (e.toElement == this.canvas)
                this.game.onMouseDown(e);
        },
        onMouseUp(e) {
            this.game.onMouseUp(e);
        },
        onMouseMove(e) {
            if (e.toElement == this.canvas)
                this.game.onMouseMove(e);
        },
		onMouseOver(e) {
			if (e.toElement == this.canvas)
				this.game.onMouseOver(e);
		},
		onMouseOut(e) {
			if (e.toElement == this.canvas)
				this.game.onMouseOut(e);
		}
    };

    function BaseGame() {
    }
    BaseGame.prototype = {
        init(gameEngine) {},
        update(gameEngine, deltaTime) {},
        draw(gameEngine, canvasCtx) {},
        onKeyDown(e) {},
        onKeyUp(e) {},
        onMouseDown(e) {},
        onMouseUp(e) {},
        onMouseMove(e) {},
		onMouseOver(e) {},
		onMouseOut(e) {}
    };
	
	return {
		GameEngine,
		BaseGame
	}
})();

var GameEngine = gameengine.GameEngine;
var BaseGame = gameengine.BaseGame;