/*
By Okazz 2025
*/
let palette = ['#e6302b', '#fbd400', '#36ad63', '#2B50AA', '#f654a9'];
let ctx;
let centerX, centerY;
let shapes = [];
let bgColor = '#000';
let shapeColor = '#fff';
let toggle = 0;

function setup() {
	createCanvas(900, 900);
	rectMode(CENTER);
	colorMode(HSB, 360, 100, 100, 100);
	ctx = drawingContext;
	centerX = width / 2;
	centerY = height / 2;
	createHoneycomb();
}

function draw() {
	background(bgColor);
	for (let s of shapes) {
		s.run();
	}

	if (frameCount % 380 == 0) {
		shapes = [];
		toggle ^= 1;
		if (toggle) {
			bgColor = '#fff';
			shapeColor = '#000';
		} else {
			bgColor = '#000';
			shapeColor = '#fff';
		}
		createHoneycomb();
	}
}

function createHoneycomb() {
	let hexSize = width / 16;
	let y = 0;
	let yCounter = 0;
	while (y <= height + hexSize) {
		let x = 0;
		while (x <= width + hexSize) {
			if (yCounter % 2 == 0) {
				createHexAnimator(x, y, hexSize, 0);
			} else {
				createHexAnimator(x + hexSize * (3 / 4), y, hexSize, 0);
			}
			x += hexSize * 1.5;
		}
		y += hexSize * sqrt(3) / 4;
		yCounter++;
	}
}

function createHexAnimator(x, y, w) {
	let motionType = ceil(random(4));
	let cls;
	let angle = 0;
	let dst = dist(x, y, centerX, centerY);
	let t = -int(map(dst, 0, sqrt(sq(width / 2) + sq(height / 2)), 0, 250));
	let clr = shapeColor;
	if (motionType == 1) {
		cls = new HexAnimation01(x, y, w, angle, t, clr);
	}
	else if (motionType == 2) {
		cls = new HexAnimation02(x, y, w, angle, t, clr);
	}
	else if (motionType == 3) {
		cls = new HexAnimation03(x, y, w, angle, t, clr);
	}
	else if (motionType == 4) {
		cls = new HexAnimation04(x, y, w, angle, t, clr);
	}
	shapes.push(cls);
}

function drawHex(x, y, w, a, c) {
	let myPoints = [];
	let numPoints = 6;
	let rad = w / 2;
	let corner = c;

	for (let i = 0; i < numPoints; i++) {
		let angle = map(i, 0, numPoints, 0, TWO_PI) + a;
		let xx = x + cos(angle) * rad;
		let yy = y + sin(angle) * rad;
		myPoints.push(createVector(xx, yy));
	}
	drawRoundPolygon(myPoints, corner);
}

function drawRoundPolygon(points, r) {
	beginShape();
	for (let i = 0; i < points.length; i++) {
		let current = points[i];
		let prev = points[(i - 1 + points.length) % points.length];
		let next = points[(i + 1) % points.length];

		let v1 = p5.Vector.sub(prev, current);
		let v2 = p5.Vector.sub(next, current);

		let len1 = v1.mag();
		let len2 = v2.mag();
		let limit1 = min(r, len1 * 0.5);
		let limit2 = min(r, len2 * 0.5);

		v1.setMag(limit1);
		v2.setMag(limit2);

		let pStart = p5.Vector.add(current, v1);
		let pEnd = p5.Vector.add(current, v2);

		vertex(pStart.x, pStart.y);
		quadraticVertex(current.x, current.y, pEnd.x, pEnd.y);
	}
	endShape(CLOSE);
}

function easeInOutQuad(x) {
	return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}


/*------------------------------------------------------------------------------------------*/

class HexAnimation01 {
	constructor(x, y, w, a, t, clr) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.a = a;
		this.corner = 0;
		this.timer = t;
		this.t1 = int(random(20, 80));
		this.t2 = this.t1 + int(random(20, 80));

		this.curW = 0;
		this.curCorner = this.w;

		this.color1 = color(clr);
		this.color2 = color(random(palette));
		this.curColor = this.color1;
	}

	show() {
		push();
		translate(this.x, this.y);
		noStroke();
		fill(this.curColor);
		drawHex(0, 0, this.curW, this.a, this.curCorner);
		pop();
	}

	update() {
		if (0 < this.timer && this.timer < this.t1) {
			let n = norm(this.timer, 0, this.t1 - 1);
			this.curW = lerp(0, this.w / 2, easeInOutQuad(n));
			this.curColor = lerpColor(this.color1, this.color2, easeInOutQuad(n));
		} else if (this.t1 < this.timer && this.timer < this.t2) {
			let n = norm(this.timer, this.t1, this.t2 - 1);
			this.curW = lerp(this.w / 2, this.w, easeInOutQuad(n));
			this.curCorner = lerp(this.w, 0, easeInOutQuad(n));
			this.curColor = lerpColor(this.color2, this.color1, easeInOutQuad(n));
		}
		this.timer++;
	}

	run() {
		this.show();
		this.update();
	}
}

class HexAnimation02 extends HexAnimation01 {
	constructor(x, y, w, a, t, clr) {
		super(x, y, w, a, t, clr);
		this.rotationOffset = int(random(4)) * (TAU / 4);
		this.shift = this.w * 2;
		this.sweepAngle = this.a;
		this.curCorner = 0;
	}

	show() {
		push();
		translate(this.x, this.y);
		rotate(this.rotationOffset);
		noStroke();
		fill(this.curColor);
		drawHex(this.shift, 0, this.curW, this.sweepAngle + this.rotationOffset, this.curCorner);
		pop();
	}

	update() {
		if (0 < this.timer && this.timer < this.t1) {
			let n = norm(this.timer, 0, this.t1 - 1);
			this.curW = lerp(0, this.w, n ** 0.5);
			this.sweepAngle = lerp(this.a, PI, easeInOutQuad(n));
			this.curColor = lerpColor(this.color1, this.color2, easeInOutQuad(n));

		} else if (this.t1 < this.timer && this.timer < this.t2) {
			let n = norm(this.timer, this.t1, this.t2 - 1);
			this.shift = lerp(this.w * 2, 0, easeInOutQuad(n));
			this.curColor = lerpColor(this.color2, this.color1, easeInOutQuad(n));
		}
		this.timer++;
	}
}

class HexAnimation03 extends HexAnimation02 {
	constructor(x, y, w, a, t, clr) {
		super(x, y, w, a, t, clr);
		this.shift = 0;
		this.angle0 = this.rotationOffset;
		this.curCorner = this.w;
		this.angleTarget = random([-1, 1]) * PI;
	}

	update() {
		if (0 < this.timer && this.timer < this.t1) {
			let n = norm(this.timer, 0, this.t1 - 1);
			this.curW = lerp(0, this.w, easeInOutQuad(n));
			this.curColor = lerpColor(this.color1, this.color2, easeInOutQuad(n));
			this.shift = lerp(0, this.w, easeInOutQuad(n));
			this.curW = lerp(0, this.w / 2, easeInOutQuad(n));
		}
		else if (this.t1 < this.timer && this.timer < this.t2) {
			let n = norm(this.timer, this.t1, this.t2 - 1);
			this.shift = lerp(this.w, 0, easeInOutQuad(n));
			this.rotationOffset = this.angle0 + lerp(0, this.angleTarget, easeInOutQuad(n));
			this.curColor = lerpColor(this.color2, this.color1, easeInOutQuad(n));
			this.curW = lerp(this.w / 2, this.w, easeInOutQuad(n));
			this.curCorner = lerp(this.w, 0, easeInOutQuad(n));
			this.sweepAngle = lerp(this.a, -this.angleTarget, easeInOutQuad(n));
		}
		this.timer++;
	}
}

class HexAnimation04 extends HexAnimation01 {
	constructor(x, y, w, a, t, clr) {
		super(x, y, w, a, t, clr);
		this.shift = 0;
		this.oosk = 0;
		this.angle = 0;
		this.angleTarget = random([-1, 1]) * PI;
	}

	show() {
		push();
		translate(this.x, this.y);
		rotate(this.angle);
		noStroke();
		fill(this.curColor);
		for (let i = 0; i < 6; i++) {
			let r = this.w / 2 * this.oosk;
			beginShape();
			vertex(this.shift, this.shift);
			vertex(this.shift + r * cos(0), this.shift + r * sin(0));
			vertex(this.shift + r * cos((TAU / 6)), this.shift + r * sin((TAU / 6)));
			endShape();
			rotate(TAU / 6);
		}
		pop();
	}

	update() {
		if (0 < this.timer && this.timer < this.t1) {
			let n = norm(this.timer, 0, this.t1 - 1);
			this.shift = lerp(0, this.w / 4, easeInOutQuad(n));
			this.curColor = lerpColor(this.color1, this.color2, easeInOutQuad(n));
			this.oosk = lerp(0, 0.5, easeInOutQuad(n));
			this.angle = lerp(0, this.angleTarget, easeInOutQuad(n));
		} else if (this.t1 < this.timer && this.timer < this.t2) {
			let n = norm(this.timer, this.t1, this.t2 - 1);
			this.shift = lerp(this.w / 4, 0, easeInOutQuad(n));
			this.curColor = lerpColor(this.color2, this.color1, easeInOutQuad(n));
			this.oosk = lerp(0.5, 1, easeInOutQuad(n));

		}
		this.timer++;
	}
}