<template>
	<canvas class="canvas" ref="canvas"> </canvas>
	<resize-observer @notify="handleResize" />
</template>

<script>
import { select } from 'd3-selection';
import { zoom, zoomIdentity } from 'd3-zoom';
import { randomNormal } from 'd3-random';

const randomX = randomNormal(1000 / 2, 80);
const randomY = randomNormal(1000 / 2, 80);
const points = Array.from({ length: 5000 }, () => [randomX(), randomY()]);

export default {
	data() {
		return {
			context: null,
			width: 0,
			height: 0,
			transform: null,
		};
	},
	methods: {
		drawChart() {
			let svg = d3.select('svg');
			svg.attr('width', svg.clientWidth).attr('height', svg.clientHeight);
		},
		handleResize() {
			let canvas = this.$refs.canvas;
			this.width = canvas.parentNode.clientWidth;
			this.height = canvas.parentNode.clientHeight;

			let d3C = select(canvas);
			d3C.style('width', this.width + 'px').style('height', this.height + 'px');

			if (window.devicePixelRatio) {
				d3C
					.attr('width', this.width * window.devicePixelRatio)
					.attr('height', this.height * window.devicePixelRatio);
				this.context.scale(window.devicePixelRatio, window.devicePixelRatio);
			} else {
				d3C.attr('width', this.width).attr('height', this.height);
			}
			this.zoomed(this.transform || zoomIdentity);
		},
		zoomed(transform) {
			const r = 1;
			let context = this.context;
			context.save();
			context.clearRect(0, 0, this.width, this.height);
			context.beginPath();
			for (const d of points) {
				const [x, y] = transform.apply(d);
				context.moveTo(x + r, y);
				context.arc(x, y, (r * transform.k) / 2, 0, 2 * Math.PI);
			}
			context.fill();
			context.restore();
			this.transform = transform;
		},
	},
	mounted() {
		select('.canvas').call(
			zoom()
				.scaleExtent([1, 8])
				.on('zoom', ({ transform }) => this.zoomed(transform))
		);
		this.context = select('.canvas').node().getContext('2d');
		this.handleResize();
	},
};
</script>

<style scoped>
canvas {
	width: 600px;
	height: 600px;
	position: absolute;
}
</style>
