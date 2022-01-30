<template>
	<div class="list flex-1">
		<Card
			v-for="event in allEvents"
			:key="event.id"
			class="pointer"
			:class="{
				selected: selectedEvent?.id == event.id,
			}"
			@click="$emit('selectEvent', event)"
			@keydown="move"
			tabindex="0"
		>
			<p>{{ event.eventType }} | {{ event.dateTime }}</p>
		</Card>
	</div>
</template>

<script>
import Card from '@/components/card';
import moment from 'moment';

function compare(momentA, momentB) {
	if (momentA > momentB) return 1;
	else if (momentA < momentB) return -1;
	else return 0;
}

export default {
	props: ['events', 'selectedEvent'],
	computed: {
		allEvents() {
			const keys = Object.keys(this.events);
			let res = Object.values(this.events)
				.map((t, i) => t.map((e) => ({ eventType: keys[i], ...e })))
				.reduce((a, t) => a.concat(t), []);

			res = res.map((t) => ({ ...t, mometDateTime: moment(t.dateTime) }));

			res = res.sort((a, b) => compare(a.mometDateTime, b.mometDateTime));
			return res;
		},
	},
	methods: {
		move(e) {
			if (this.selectedEvent && ['ArrowUp', 'ArrowDown'].includes(e.key)) {
				const events = this.allEvents;
				let i = events.indexOf(events.find((t) => t.id == this.selectedEvent.id));
				i += e.key == 'ArrowUp' ? -1 : 1;
				if (i >= 0 && i < events.length) this.$emit('selectEvent', events[i]);
			}
		},
	},
	components: {
		Card,
	},
};
</script>

<style lang="scss" scoped>
.list {
	min-width: 200px;
	div {
		margin: 5px;
		&:focus {
			outline: none;
		}
	}
}
</style>
