
function TabletPen () { this.init.apply(this, arguments) };
TabletPen.prototype = {
	init : function () {
		var self = this;
		self.wacom = self.getWacomPlugin();
		self.supportWacom = self.wacom.isWacom;
		self.eraser = false;
		self.size   = 1;
	},

	setSize : function (size) {
		this.size = size;
	},

	isEraser : function () {
		return this.supportWacom ? this.wacom.isEraser : self.eraser;
	},

	pressure : function () {
		return this.supportWacom ? this.wacom.pressure : 1.0;
	},

	getWacomPlugin : function () {
		return document.embeds["wacom-plugin"];
	}
};

function Oecan () { this.init.apply(this, arguments) };
Oecan.prototype = {
	init : function (container) {
		var self = this;
		var canvas = document.createElement('canvas');
		canvas.setAttribute('width', '800');
		canvas.setAttribute('height', '600');
		canvas.setAttribute('style', 'background: #fff; border: 1px solid #fff; cursor: none');
		canvas.id = 'canvas';
		container.appendChild(canvas);
		self.container = container;
		self.canvas = canvas;
		self.ctx = canvas.getContext('2d');
		self.initCanvas();
		self.initPen();
		self.bindEvents();

		self.setPen(5);
	},

	initCanvas : function () {
		var self = this;
		self.ctx.fillStyle = '#000000';
	},

	initPen : function () {
		var self = this;
		self.pen = document.createElement('canvas');
		self.pen.setAttribute('style', 'cursor: none');
		self.container.appendChild(self.pen);
		
		$(self.pen).mousedown(function (e) {
			return $(self.canvas).trigger(e);
		});

		$(window).
			mousemove(function (e) {
				var x = e.clientX, y = e.clientY;
				var o = $(self.canvas).offset();
				var w = $(self.canvas).width(), h = $(self.canvas).height();
				if (o.left < x && x < o.left + w &&
					o.top  < y && y < o.top  + h) {
					// inner canvas
					$(self.pen).show();

					$(self.pen).offset({
						top : e.clientY - self.penOffset,
						left : e.clientX - self.penOffset,
					});
				} else {
					$(self.pen).hide();
				}
			});

		self.tabletPen = new TabletPen();
	},

	setPen : function (size) {
		var self = this;
		if (size < 1) size = 1;
		self.penSize = size;

		var pen = self.pen;
		if (size == 1) {
			pen.setAttribute('width', '19');
			pen.setAttribute('height', '19');
			var ctx = pen.getContext('2d');
			ctx.fillStyle = '#ffffff';
			ctx.fillRect( 8,  0, 3, 3);
			ctx.fillRect( 0,  8, 3, 3);
			ctx.fillRect( 8,  8, 3, 3);
			ctx.fillRect(16,  8, 3, 3);
			ctx.fillRect( 8, 16, 3, 3);
			ctx.fillStyle = '#000000';
			ctx.fillRect( 9,  1, 1, 1);
			ctx.fillRect( 1,  9, 1, 1);
			ctx.fillRect( 9,  9, 1, 1);
			ctx.fillRect(17,  9, 1, 1);
			ctx.fillRect( 9, 17, 1, 1);
			self.penOffset =  8;
		} else {
			pen.setAttribute('width', size + 3);
			pen.setAttribute('height', size + 3);
			var ctx = pen.getContext('2d');
			ctx.clearRect(0, 0, size + 1, size + 1);
			ctx.fillStyle = '#ffffff';
			self.drawLine(ctx, 1, 1,        1,    size + 2,    1);
			self.drawLine(ctx, 1, size + 2, 1,    size + 2, size + 2);
			self.drawLine(ctx, 1, size + 2, size + 2,    1, size + 2);
			self.drawLine(ctx, 1, 1,        size + 2,    1,    1);
			ctx.fillStyle = '#000000';
			self.drawLine(ctx, 1, 2,        2,    size + 1,    2);
			self.drawLine(ctx, 1, size + 1, 2,    size + 1, size + 1);
			self.drawLine(ctx, 1, size + 1, size + 1,    2, size + 1);
			self.drawLine(ctx, 1, 2,        size + 1,    2,    2);
			self.penOffset =  Math.floor(size / 2) - 1;
		}
	},

	setColor : function (color) {
		var self = this;
		self.ctx.fillStyle = color;
	},

	snapshot : function () {
		window.open(this.canvas.toDataURL('image/png'));
	},

	bindEvents : function () {
		var self = this;
		var canvas = self.canvas;
		var ctx    = self.ctx;
		var down   = null;

		var offset = $(canvas).offset();
		var ox = offset.left, oy = offset.top;

		$(canvas).mousedown(function (e) {
			var x = e.clientX - ox, y = e.clientY - oy;
			down = {
				x: x,
				y: y
			};
		});

		$(window).mousemove(function (e) {
			if (!down) return;
			var x = e.clientX - ox, y = e.clientY - oy;
			self.drawLine(ctx, self.penSize * self.tabletPen.pressure(), down.x, down.y, x, y);
			down = {
				x: x,
				y: y
			};
		});

		$(window).mouseup(function (e) {
			if (!down) return;
			var x = e.clientX - ox, y = e.clientY - oy;
			self.drawLine(ctx, self.penSize * self.tabletPen.pressure(), down.x, down.y, x, y);
			down = null;
		});
		
		$(window).resize(function () {
			var offset = $(canvas).position();
			ox = offset.left, oy = offset.top;
		});
	},

	drawLine : function (ctx, size, x0, y0, x1, y1, method) {
		if (!method) method = 'fillRect';
		var ww	 = Math.round(size);
		var wh	 = Math.round(ww / 2);
		x0 -= wh, y0 -= wh, x1 -= wh, y1 -= wh;

		var dy = y1 - y0,  dx = x1 - x0;
		var sy = 1,  sx = 1;

		if (dy < 0) {
			dy = -dy;
			sy = -1;
		}

		if (dx < 0) {
			dx = -dx;
			sx = -1;
		}

		dy = dy << 1;
		dx = dx << 1;
		ctx[method](x0, y0, ww, ww);
		if (dx > dy) {
			var ee = dy - (dx >> 1);
			while (x0 != x1) {
				if (ee >= 0) {
					y0 += sy;
					ee -= dx;
				}
				x0 += sx;
				ee += dy;
				ctx[method](x0, y0, ww, ww);
			}
		} else {
			var ee = dx - (dy >> 1);
			while (y0 != y1) {
				if (ee >= 0) {
					x0 += sx;
					ee -= dy;
				}

				y0 += sy;
				ee += dx;
				ctx[method](x0, y0, ww, ww);
			}
		}
	}
};

$(function () {
	var Global = (function () { return this })();
	Global.O = new Oecan(document.getElementById('canvas'));
});
