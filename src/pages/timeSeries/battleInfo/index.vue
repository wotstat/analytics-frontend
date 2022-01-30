<template>
	<div class="flex-col flex-1">
		<Footer v-model="state" @back="$emit('back')" />
		<p v-if="loading">Loading</p>
		<div class="flex flex-1 overflow-y-auto" v-if="events && state == 'list'">
			<EventList
				class="overflow-y-auto flex-1"
				:events="events"
				:selectedEvent="selectedEvent"
				@selectEvent="selectEvent"
			/>

			<EventDetail
				v-if="events && selectedEvent"
				class="overflow-y-auto min-w-200"
				:selectedEvent="selectedEvent"
			/>
		</div>
		<div class="flex-1" v-if="events && state == 'chart'">
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

<style lang="scss" scoped>
.min-w-200 {
	min-width: 200px;
}
</style>
