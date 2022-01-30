<template>
	<div class="parent" ref="parent">
		<svg class="svg" ref="svg" :width="width">
			<g class="hp-cell-parent" x="20">
				<rect class="background" :width="width - 40" />
				<g class="cells"></g>
				<g class="axis"></g>
				<g class="lines" stroke="gray" stroke-width="1"></g>
				<rect class="upground" :width="width - 40" />
				<text fill="mouse-info" x="40" y="50">06:00</text>
			</g>
		</svg>
	</div>
	<resize-observer @notify="handleResize" />
</template>

<script>
import { select, selectAll, Selection } from 'd3-selection';
import { zoom, zoomIdentity, zoomTransform } from 'd3-zoom';
import { axisBottom } from 'd3-axis';
import { scaleLinear, scaleTime } from 'd3-scale';
import { timeFormat } from 'd3-time-format';
import { timeSecond } from 'd3-time';

const HORIZONTAL_PADDING = 20;

function drawTime(width, bellowZero, aboveZero) {
	select('.hp-cell-parent .axis')
		.call(
			axisBottom(
				scaleTime()
					.domain([-bellowZero * 1000, aboveZero * 1000])
					.range([0, width])
			)
				.ticks(width / 80)
				// .tickValues([-bellowZero * 1000])
				.tickFormat((t) =>
					(t >= 0 ? timeFormat('%M:%S')(t * 1) : `-${timeFormat('%M:%S')(-t * 1)}`).replace(
						'00:00',
						'0'
					)
				)
		)
		.call((g) => g.select('.domain').attr('display', 'none'));
}

function drawLine(width, bellowZero, aboveZero) {
	const cellParent = select('.hp-cell-parent');
	cellParent.selectAll('#cell-info').remove();
	let timeInterval = (totalTime) => {
		const length = [1, 2.5, 5, 30 / 4, 30 / 2, 30, 60];
		for (let i = 0; i < length.length; i++) {
			const time = length[i];
			if (width / (totalTime / time) > 7) {
				return time;
			}
		}

		return length[length.length - 1];
	};

	const dt = timeInterval(bellowZero + aboveZero);
	const stepBellow = bellowZero / dt;
	const stepAbove = aboveZero / dt;

	const step = stepBellow + stepAbove;

	const count = Math.trunc(stepBellow) + Math.trunc(stepAbove);
	const cells = Array.from({ length: count + 2 }, (d, i) => 0.3);
	const cellWidth = (width * (count / step)) / count;

	const offsetX = (stepBellow - Math.trunc(stepBellow)) * cellWidth;

	let handleMouseOver = (d, i) => {
		console.log('handleMouseOver');
		let t = cellParent
			.append('text')
			.attr('id', 'cell-info')
			.attr('class', 'cell-info')
			.attr(
				'transform',
				`translate(${d.target.transform.baseVal.consolidate().matrix.e + cellWidth / 2}, 40)`
			)
			.text('бой');
		t.append('tspan').attr('x', '0').attr('dy', '1em').text(`хп: ${i}`);
	};

	let handleMouseOut = (d, i) => {
		console.log('handleMouseOut');
		cellParent.selectAll('#cell-info').remove();
	};

	var cell = select('.hp-cell-parent .cells').selectAll('.cell').data(cells),
		cellExit = cell.exit(),
		cellEnter = cell
			.enter()
			.append('g')
			.attr('class', 'cell')
			.on('mouseover', handleMouseOver)
			.on('mouseout', handleMouseOut),
		main = cell.select('.main'),
		render = cell.select('.render');

	main = main.merge(
		cellEnter.append('rect').attr('class', 'main skip-events').attr('height', 20).attr('width', 1)
	);

	render = render.merge(cellEnter.append('rect').attr('class', 'render skip-events'));

	render
		.attr('height', (d, i) => d * 20)
		.attr('width', (d, i) => {
			if (i == 0) return offsetX;
			else if (i == cells.length - 1) return Math.max(0, width - (offsetX + cellWidth * count));
			return cellWidth;
		})
		.attr('y', (d, i) => 20 - d * 20);

	select('.hp-cell-parent .cells')
		.selectAll('.cell')
		.data(cells)
		.attr('transform', (d, i) => `translate(${i == 0 ? 0 : cellWidth * (i - 1) + offsetX}, 0)`);

	cellExit.remove();

	select('.hp-cell-parent .lines')
		.selectAll('line')
		.data(Array.from({ length: count + 1 }))
		.join('line')
		.attr('x1', (d, i) => cellWidth * i + offsetX)
		.attr('x2', (d, i) => cellWidth * i + offsetX)
		.attr('y1', 0)
		.attr('y2', 20)
		.attr('class', 'skip-events');
}

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
			let mainWidth = this.width - 2 * HORIZONTAL_PADDING;

			drawLine(mainWidth, 55.5, 7.2 * 60);

			drawTime(mainWidth, 55.5, 7.2 * 60);

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
	overflow-x: auto;
}
svg {
	// height: 200px;

	.hp-cell-parent {
		transform: translate(20px, 80px);

		.background,
		.upground {
			height: 20px;
		}

		.axis {
			transform: translateY(22px);
		}
	}
}
</style>
