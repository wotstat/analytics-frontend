<template>
	<div class="parent" ref="parent">
		<svg class="svg" ref="svg" :width="width">
			<g class="hp-cell-parent" x="20">
				<rect class="background" :width="width - 40" />
				<g class="cells"></g>
				<g class="lines" stroke="gray" stroke-width="1"></g>
				<rect class="upground" :width="width - 40" />
			</g>
		</svg>
	</div>
	<resize-observer @notify="handleResize" />
</template>

<script>
import { select } from 'd3-selection';
import { zoom, zoomIdentity, zoomTransform } from 'd3-zoom';
import { randomNormal } from 'd3-random';

export default {
	data() {
		return {
			baseWidth: 500,
			width: 100,
			transform: null,
		};
	},
	methods: {
		handleResize() {
			let svg = this.$refs.svg;
			this.baseWidth = svg.parentNode.clientWidth;
			select('.parent')
				.on('scrolled', this.scrolled)
				.call(
					zoom()
						.translateExtent([
							[0, 0],
							[this.baseWidth, 100],
						])
						.scaleExtent([1, 4])
						.on('zoom', this.zoomed)
				);
			this.zoomed({ transform: zoomIdentity });
		},
		draw() {
			select('.hp-cell-parent .lines')
				.selectAll('line')
				.data(Array.from({ length: 900 }, (d, i) => i / 900))
				.join('line')
				.attr('x1', (d, i) => ((this.width - 40) / 900) * i)
				.attr('x2', (d, i) => ((this.width - 40) / 900) * i)
				.attr('y1', 0)
				.attr('y2', 20);

			select('.hp-cell-parent .cells')
				.selectAll('rect')
				.data(Array.from({ length: 900 }, (d, i) => i / 900))
				.join('rect')
				.attr('x', (d, i) => ((this.width - 40) / 900) * i)
				.attr('y', (d, i) => 20 - d * 20)
				.attr('width', (this.width - 40) / 900)
				.attr('height', (d, i) => d * 20)
				.attr('class', 'cell');

			select('.svg')
				.selectAll('circle')
				.data([1, 2, 3, 4, 5, 6, 7, 8, 9, 0])
				.join('circle')
				.attr('r', 10)
				.attr('cy', 50)
				.attr('cx', (d, i) => (this.width * i) / 11 + 50);
		},
		zoomed({ transform }) {
			this.width = this.baseWidth * transform.k;
			select('.parent').node().scrollLeft = -transform.x;

			this.draw();
		},
		scrolled() {
			const wrapper = select('.parent');
			const x = wrapper.node().scrollLeft + wrapper.node().clientWidth / 2;
			const scale = zoomTransform(wrapper.node()).k;
			wrapper.call(zoom().translateTo, x / scale, 1);
		},
	},
	mounted() {
		this.handleResize();

		this.width = this.baseWidth;
		this.draw();
	},
};
</script>

<style lang="scss" scoped>
.parent {
	overflow-x: scroll;
}
svg {
	// height: 200px;

	.hp-cell-parent {
		transform: translate(20px, 80px);

		.background,
		.upground {
			height: 20px;
		}
	}
}
</style>
