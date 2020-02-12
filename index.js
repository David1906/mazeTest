// setup variables
const { Engine, Render, Runner, World, Bodies, Body, Events, MouseConstraint, Mouse } = Matter;
// const cells = 3;

const width = window.innerWidth * 0.8;
const height = window.innerHeight * 0.8;
const margin = 5;
const wallWeight = margin;

const cellsX = 10;
const cellSizeX = (width - margin * 2) / cellsX;
const halfCellX = cellSizeX / 2;

const cellsY = 10;
const cellSizeY = (height - margin * 2) / cellsY;
const halfCellY = cellSizeY / 2;

const grid = Array(cellsY).fill(null).map(() => Array(cellsX).fill(false));
const vertical = Array(cellsY).fill(null).map(() => Array(cellsY - 1).fill(false));
const horizontal = Array(cellsX - 1).fill(null).map(() => Array(cellsX).fill(false));

// create an engine
const engine = Engine.create();
engine.world.gravity.y = 1;

// create a renderer
const render = Render.create({
	element: document.body,
	engine: engine,
	options: {
		width,
		height,
		wireframes: false,
		background: '#333333'
	}
});

function createWalls(size = 10) {
	const halfWidth = width / 2;
	const halfHeight = height / 2;
	const halfSize = size / 2;

	return [
		//top wall
		Bodies.rectangle(halfWidth, halfSize, width, size, { isStatic: true }),
		//bottom wall
		Bodies.rectangle(halfWidth, height - halfSize, width, size, { isStatic: true }),
		//left wall
		Bodies.rectangle(halfSize, halfHeight, size, height, { isStatic: true }),
		//rigth wall
		Bodies.rectangle(width - halfSize, halfHeight, size, height, { isStatic: true })
	];
}

// crate walls
World.add(engine.world, createWalls(margin));

// add mouse control
// World.add(
// 	engine.world,
// 	MouseConstraint.create(engine, {
// 		mouse: Mouse.create(render.canvas)
// 	})
// );

// run the engine
Engine.run(engine);

// run the renderer
Render.run(render);

function stepTroughCell(row, column) {
	// return if cell is checked
	if (grid[row][column]) return;

	// mark cell as visited
	grid[row][column] = true;

	// Assemble randomly-orderes list of neightbors
	const neightbors = shuffle([
		[ row - 1, column, 'up' ],
		[ row, column + 1, 'right' ],
		[ row + 1, column, 'down' ],
		[ row, column - 1, 'left' ]
	]);

	// visit next neightbor
	neightbors.forEach(([ r, c, d ]) => {
		// verify bounds
		if (r < 0 || r >= cellsY || c < 0 || c >= cellsX) return;

		// if cell is alrady visited, continue
		if (grid[r][c]) return;

		//Remove wall
		switch (d) {
			case 'up':
				horizontal[r][c] = true;
				break;
			case 'down':
				horizontal[r - 1][c] = true;
				break;
			case 'right':
				vertical[r][c - 1] = true;
				break;
			case 'left':
				vertical[r][c] = true;
				break;
		}

		// visit next cell
		stepTroughCell(r, c);
	});
}

const shuffle = (arr) => {
	for (let i = 0; i < arr.length; i++) {
		const j = ~~(Math.random() * arr.length);
		[ arr[i], arr[j] ] = [ arr[j], arr[i] ];
	}
	return arr;
};

stepTroughCell(2, 2);

horizontal.forEach((row, y) => {
	row.forEach((open, x) => {
		if (open) return;

		const wall = Bodies.rectangle(
			margin + (x * cellSizeX + cellSizeX / 2),
			margin + (y + 1) * cellSizeY,
			cellSizeX + wallWeight,
			wallWeight,
			{
				isStatic: true,
				fillStyle: 'red',
				label: 'wall',
				render: {
					fillStyle: 'white'
				}
			}
		);

		World.add(engine.world, wall);
	});
});

vertical.forEach((row, y) => {
	row.forEach((open, x) => {
		if (open) return;

		const wall = Bodies.rectangle(
			margin + (x + 1) * cellSizeX,
			margin + (y * cellSizeY + cellSizeY / 2),
			wallWeight,
			cellSizeY + wallWeight,
			{
				isStatic: true,
				label: 'wall',
				render: {
					fillStyle: 'white'
				}
			}
		);

		World.add(engine.world, wall);
	});
});

const goal = Bodies.rectangle(
	width - halfCellX - margin,
	height - halfCellY - margin,
	halfCellX,
	halfCellY,
	{
		isStatic: true,
		label: 'goal',
		render: {
			fillStyle: '#8cba51'
		}
	}
);
World.add(engine.world, goal);

const ball = Bodies.circle(halfCellX + margin, halfCellY + margin, halfCellY * 0.5, {
	label: 'ball',
	render: {
		fillStyle: '#ccedd2'
	}
});
World.add(engine.world, ball);

document.addEventListener('keydown', (e) => {
	const { x, y } = ball.velocity;
	const vel = 5;
	switch (e.keyCode) {
		case 38:
			Body.setVelocity(ball, { x, y: -vel });
			break;
		case 39:
			Body.setVelocity(ball, { x: +vel, y });
			break;
		case 40:
			Body.setVelocity(ball, { x, y: +vel });
			break;
		case 37:
			Body.setVelocity(ball, { x: -vel, y });
			break;
	}
});

document.addEventListener('keyup', (e) => {
	Body.setVelocity(ball, { x: 0, y: 0 });
});

// wincondition
Events.on(engine, 'collisionStart', (e) => {
	const labels = [ 'ball', 'goal' ];

	e.pairs.forEach((collision) => {
		if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
			engine.world.gravity.y = 1;

			engine.world.bodies.forEach((body) => {
				if (body.label === 'wall') {
					Body.setStatic(body, false);
				}
			});

			Engine.stop(engine);
		}
	});
});
