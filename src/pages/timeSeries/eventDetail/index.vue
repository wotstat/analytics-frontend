<template>
	<div class="detail">
		<component :is="eventComponent" v-if="eventComponent" :event="selectedEvent" />
		<p v-else>{{ selectedEvent }}</p>
	</div>
</template>

<script>
import onBattleStart from './events/onBattleStart.vue';
import onShot from './events/onShot.vue';
import onBattleResult from './events/onBattleResult.vue';

const eventComponents = { onBattleStart, onShot, onBattleResult };

export default {
	data() {
		return {
			events: { onBattleStart },
		};
	},
	computed: {
		eventComponent() {
			return eventComponents[this.selectedEvent.eventType];
		},
	},
	props: ['selectedEvent'],
	components: {
		...eventComponents,
	},
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.detail {
	width: 500px;
	border-left: $border-line;
}
</style>
