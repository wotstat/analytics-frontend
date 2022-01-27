<template>
	<div class="flex-col flex-1">
		<Footer v-model="state" />
		<p v-if="loading">Loading</p>
		<div class="flex flex-1" v-if="events && state == 'list'">
			<EventList
				class="overflow-y-auto flex-1"
				:events="events"
				:selectedEvent="selectedEvent"
				@selectEvent="selectEvent"
			/>

			<EventDetail
				v-if="events && selectedEvent"
				class="overflow-y-auto"
				:selectedEvent="selectedEvent"
			/>
		</div>
		<div class="flex flex-1" v-if="events && state == 'chart'">
			<EventChart />
		</div>
	</div>
</template>

<script>
import EventList from './list/index.vue';
import EventChart from './сhart/index.vue';
import EventDetail from './eventDetail/index.vue';
import Footer from './footer/index.vue';

export default {
	data() {
		return {
			selectedEvent: null,
			state: 'chart',
		};
	},
	props: ['events', 'loading'],
	methods: {
		selectEvent(event) {
			if (this.selectedEvent?.id == event.id) {
				this.selectedEvent = null;
			} else {
				this.selectedEvent = event;
			}
			console.log(this.selectedEvent);
		},
	},
	components: {
		EventList,
		EventDetail,
		Footer,
		EventChart,
	},
	watch: {
		events(val) {
			this.selectedEvent = null;
		},
	},
};
</script>
