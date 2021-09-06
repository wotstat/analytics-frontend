<template>
	<div class="list flex-1">
		<p v-if="loading">Loading</p>
		<Card v-for="event in allEvents" :key="event.id">
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
	props: ['events', 'loading'],
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
	components: {
		Card,
	},
};
</script>

<style lang="scss" scoped>
.list {
	div {
		margin: 5px;
	}
}
</style>
