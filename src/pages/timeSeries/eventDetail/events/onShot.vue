<template>
	<div>
		<p>dateTime: {{ event.dateTime }}</p>
		<p>battleTimeMS: {{ event.battleTimeMS }}</p>
		<p>autoAim: {{ event.autoAim }}</p>
		<p>serverAim: {{ event.serverAim }}</p>
		<p>ping: {{ event.ping * 1000 }} ms</p>
		<p>fps: {{ event.fps }}</p>
		<p>gunPoint: {{ bd2vector(event, 'gunPoint') }}</p>

		<p>battleDispersion: {{ event.battleDispersion }}</p>
		<p>gunDispersion: {{ event.gunDispersion }}</p>

		<hr />
		<p>clientShotDispersion: {{ event.clientShotDispersion }}</p>
		<p>serverShotDispersion: {{ event.serverShotDispersion }}</p>
		<p>serverMarkerPoint: {{ bd2vector(event, 'serverMarkerPoint') }}</p>
		<p>clientMarkerPoint: {{ bd2vector(event, 'clientMarkerPoint') }}</p>

		<hr />
		<p>tracerStart: {{ bd2vector(event, 'tracerStart') }}</p>
		<p>tracerEnd: {{ bd2vector(event, 'tracerEnd') }}</p>
		<p>tracerVelocity: {{ bd2vector(event, 'tracerVelocity') }}</p>
		<p>gravity: {{ event.gravity }}</p>

		<hr />
		<p>hitReason: {{ event.hitReason || 'не попал' }}</p>
		<p>hitPoint: {{ bd2vector(event, 'hitPoint') }}</p>

		<hr />
		<div class="results" v-if="event.results.length > 0">
			<p>Result</p>
			<div v-for="result in event.results" :key="event.id + result.order" class="result">
				<p>order: {{ result.order }}</p>
				<p>tankTag: {{ result.tankTag }}</p>
				<p>flags: {{ result.flags }}</p>
				<p v-if="result.shotDamage > 0">shotDamage: {{ result.shotDamage }}</p>
				<p v-if="result.fireDamage > 0">fireDamage: {{ result.fireDamage }}</p>
				<p v-if="result.shotHealth != null">shotHealth: {{ result.shotHealth }}</p>
				<p v-if="result.fireHealth != null">fireHealth: {{ result.fireHealth }}</p>
				<p v-if="result.ammoBayDestroyed">ammoBayDestroyed: {{ result.ammoBayDestroyed }}</p>
				<hr />
			</div>
		</div>
	</div>
</template>

<script>
import { bd2vector } from '@/utils';
export default {
	props: ['event'],
	methods: {
		bd2vector: (a, b) => bd2vector(a, b),
	},
};
</script>

<style lang="scss" scoped>
.result {
	padding-left: 10px;
}
</style>
