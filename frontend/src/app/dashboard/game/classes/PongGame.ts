import { Howl } from "howler";
import {
	Bodies,
	Body,
	Composite,
	Engine,
	Events,
	Render,
	Runner,
} from "matter-js";

const engine = Engine.create({
	gravity: {
		x: 0,
		y: 0,
	},
});

class PongGame {
	private ball: any;
	private topPaddle: any;
	private bottomPaddle: any;
	private rightRect: any;
	private leftRect: any;
	private divWidth: number;
	private divHeight: number;
	private paddleWidth: number = 170;
	private moveInterval: any;
	private lunchGameInterval: any;
	private handleKeyDown: any;
	private handleKeyUp: any;
	private maxBallSpeed: number = 10;
	private sound = {
		topPaddleSound: new Howl({
			src: ["/assets/sounds/leftPaddle.wav"],
		}),
		bottomPaddleSound: new Howl({
			src: ["/assets/sounds/rightPaddle.wav"],
		}),
		win: new Howl({
			src: ["/assets/sounds/winSound.mp3"],
		}),
	};
	private currentBallSpeed: any = {
		x: 4,
		y: 4,
	};

	constructor(
		private parentDiv: HTMLDivElement,
		private socket?: any,
	) {
		this.divWidth = this.parentDiv.getBoundingClientRect().width;
		this.divHeight = this.parentDiv.getBoundingClientRect().height;

		this.ball = Bodies.circle(this.divWidth / 2, this.divHeight / 2, 15, {
			label: "ball",
			render: {
				fillStyle: "#FFF",
			},
			frictionAir: 0,
			friction: 0,
			inertia: Infinity,
			restitution: 1,
		});

		// Create Two Paddles:
		const topRect = Bodies.rectangle(this.divWidth / 2, 0, this.divWidth, 20, {
			render: {
				fillStyle: "red",
			},
			isStatic: true,
		});
		const bottomRect = Bodies.rectangle(
			this.divWidth / 2,
			this.divHeight,
			this.divWidth,
			20,
			{
				render: {
					fillStyle: "yellow",
				},
				isStatic: true,
			},
		);

		this.topPaddle = Bodies.rectangle(this.divWidth / 2, 30, 170, 15, {
			label: "topPaddle",
			render: {
				fillStyle: "#4FD6FF",
			},
			isStatic: true,
			chamfer: { radius: 10 },
		});
		this.bottomPaddle = Bodies.rectangle(
			this.divWidth / 2,
			this.divHeight - 30,
			170,
			15,
			{
				label: "bottomPaddle",
				render: {
					fillStyle: "#FF5269",
				},
				isStatic: true,
				chamfer: { radius: 10 },
			},
		);

		// Create Two Boundies:
		this.rightRect = Bodies.rectangle(
			this.divWidth,
			this.divHeight / 2,
			20,
			this.divHeight,
			{
				label: "rightRect",
				render: {
					fillStyle: "#CFF4FF",
				},
				isStatic: true,
			},
		);

		this.leftRect = Bodies.rectangle(
			0,
			this.divHeight / 2,
			20,
			this.divHeight,
			{
				label: "leftRect",
				render: {
					fillStyle: "#CFF4FF",
				},
				isStatic: true,
			},
		);

		Composite.add(engine.world, [
			this.ball,
			this.topPaddle,
			this.bottomPaddle,
			this.rightRect,
			this.leftRect,
			// bottomRect,
			topRect,
		]);

		const render = Render.create({
			element: this.parentDiv,
			engine: engine,
			options: {
				background: "#3A3561",
				width: this.divWidth,
				height: this.divHeight,
				wireframes: false,
			},
		});
		Render.run(render);

		if (this.socket) this.moveOnlineModeBall();
		else {
			this.setBotModeBall();
			this.moveBotPaddle();
		}

		this.movePaddle();

		//Run Game
		this.startGame();
	}

	startGame = (): void => {
		this.lunchGameInterval = setTimeout(() => {
			// run the engine
			Runner.run(Runner.create(), engine);
		}, 1000);
	};

	moveOnlineModeBall = (): void => {
		this.socket.on("setBallVelocity", (data: any) => {
			Body.setVelocity(this.ball, {
				x: data.x,
				y: data.y,
			});
		});
		this.socket.on("updateBallPosition", (data: any) => {
			Body.setPosition(this.ball, {
				x: data.x,
				y: data.y,
			});
		});
	};

	setBotModeBall = (): void => {
		Body.setVelocity(this.ball, {
			x: this.currentBallSpeed.x,
			y: this.currentBallSpeed.y,
		});
	};

	setBallSpeed = (): void => {
		// Limit the ball's speed
		if (
			this.currentBallSpeed.x < this.maxBallSpeed &&
			this.currentBallSpeed.y < this.maxBallSpeed
		)
			Body.setVelocity(this.ball, {
				x: (this.currentBallSpeed.x += 0.2),
				y: (this.currentBallSpeed.y += 0.2),
			});
	};

	// resetObjsDefaultPosition = (): void => {
	// 	Matter.Body.setPosition(this.ball, {
	// 		x: this.ball.xCord,
	// 		y: this.ball.yCord,
	// 	});
	// clearInterval(this.moveInterval);
	// };

	movePaddle = (): void => {
		if (this.socket) {
			document.addEventListener("keydown", (e) => {
				if (e.key === "d" || e.key === "ArrowRight")
					this.socket.emit("keyevent", {
						key: e.key,
						state: "keydown",
					});
				else if (e.key === "a" || e.key === "ArrowLeft")
					this.socket.emit("keyevent", {
						key: e.key,
						state: "keydown",
					});
			});

			document.addEventListener("keyup", (e) => {
				if (e.key === "d" || e.key === "ArrowRight")
					this.socket.emit("keyevent", {
						key: e.key,
						state: "keyup",
					});
				else if (e.key === "a" || e.key === "ArrowLeft")
					this.socket.emit("keyevent", {
						key: e.key,
						state: "keyup",
					});
			});
			this.socket.on("updatePaddlePosition", (data: any) => {
				Body.setPosition(this.bottomPaddle, {
					x: data.xPosition,
					y: this.bottomPaddle.position.y,
				});
			});
		} else {
			let movingRight = false;
			let movingLeft = false;

			this.handleKeyDown = (e: KeyboardEvent) => {
				if (e.key === "d" || e.key === "ArrowRight") movingRight = true;
				else if (e.key === "a" || e.key === "ArrowLeft") movingLeft = true;
			};

			this.handleKeyUp = (e: KeyboardEvent) => {
				if (e.key === "d" || e.key === "ArrowRight") movingRight = false;
				else if (e.key === "a" || e.key === "ArrowLeft") movingLeft = false;
			};

			document.addEventListener("keydown", this.handleKeyDown);

			document.addEventListener("keyup", this.handleKeyUp);

			this.moveInterval = setInterval(() => {
				let stepX;

				if (movingLeft) {
					stepX = this.bottomPaddle.position.x - 11;
					if (stepX <= this.paddleWidth / 2) {
						stepX = this.paddleWidth / 2;
					}
					Body.setPosition(this.bottomPaddle, {
						x: stepX,
						y: this.bottomPaddle.position.y,
					});
				} else if (movingRight) {
					stepX = this.bottomPaddle.position.x + 11;
					if (stepX >= this.divWidth - this.paddleWidth / 2) {
						stepX = this.divWidth - this.paddleWidth / 2;
					}
					Body.setPosition(this.bottomPaddle, {
						x: stepX,
						y: this.bottomPaddle.position.y,
					});
				}
			}, 10);
		}
		//when a player score a point
		// clearInterval(moveInterval);
	};

	moveBotPaddle = () => {
		let currentPositionX;

		// Events.on(engine, "collisionStart", (e) => {
		// 	const pairs = e.pairs[0];
		// 	if (pairs.bodyA === this.topPaddle || pairs.bodyB === this.topPaddle) {
		// 		this.sound.topPaddleSound.play();
		// 		this.setBallSpeed();
		// 	} else if (
		// 		pairs.bodyA === this.bottomPaddle ||
		// 		pairs.bodyB === this.bottomPaddle
		// 	) {
		// 		this.sound.bottomPaddleSound.play();
		// 		this.setBallSpeed();
		// 	}
		// });

		Events.on(engine, "collisionStart", (e: any) => {
			const pairs = e.pairs[0];
			if (pairs.bodyA === this.topPaddle || pairs.bodyB === this.topPaddle) {
				this.sound.topPaddleSound.play();
				this.setBallSpeed();
			} else if (
				pairs.bodyA === this.bottomPaddle ||
				pairs.bodyB === this.bottomPaddle
			) {
				this.sound.bottomPaddleSound.play();
				this.setBallSpeed();
			}
		});

		// Matter.Events.on(engine, "collisionStart", (e) => {
		// 	this.ball.body.velocity.x = -this.ball.body.velocity.x;
		// 	this.ball.body.velocity.y = -this.ball.body.velocity.y;

		// 	if (Math.random() < 0.5) this.ball.body.velocity.x *= -1;
		// 	if (Math.random() < 0.5) this.ball.body.velocity.y *= -1;
		// });

		Events.on(engine, "beforeUpdate", () => {
			if (this.ball.position.y + this.ball.circleRadius >= this.divHeight - 8) {
				this.sound.win.play();
			}
			currentPositionX = this.ball.position.x;
			// if (
			// 	this.ball.position.y >=
			// 	this.bottomPaddle.position.y + this.bottomPaddle.height / 2
			// )
			// 	this.resetObjsDefaultPosition();
			if (
				this.topPaddle.position.x + this.paddleWidth / 2 >= this.divWidth &&
				this.ball.position.x >= this.divWidth - this.paddleWidth / 2
			)
				currentPositionX = this.divWidth - this.paddleWidth / 2;
			else if (
				this.topPaddle.position.x - this.paddleWidth / 2 <= 0 &&
				this.ball.position.x <= this.paddleWidth / 2
			)
				currentPositionX = this.paddleWidth / 2;

			Body.setPosition(this.topPaddle, {
				x: currentPositionX,
				y: this.topPaddle.position.y,
			});
		});
	};

	clear = () => {
		Composite.remove(engine.world, [
			this.ball,
			this.topPaddle,
			this.bottomPaddle,
			this.rightRect,
			this.leftRect,
			// bottomRect,
			// topRect,
		]);

		// clearTimeout Of Paddle Game Runner:
		clearTimeout(this.lunchGameInterval);
		// ClearInterval Of Paddle Movement:
		if (this.socket)
			clearInterval(this.moveInterval);

		// Remove Listners:
		document.removeEventListener("keydown", this.handleKeyDown);
		document.removeEventListener("keyup", this.handleKeyUp);

		// Close Socket!
		this.socket.disconnect();
	};
}

export default PongGame;
