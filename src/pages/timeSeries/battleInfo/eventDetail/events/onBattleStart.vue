<template>
	<p>playerName: {{ event.playerName }}</p>
	<p>playerWGID: {{ event.playerWGID }}</p>
	<p>playerClanTag: {{ event.playerClanTag }}</p>
	<p>gunTag: {{ event.gunTag }}</p>
	<p>tankTag: {{ event.tankTag }}</p>
	<p>tankLevel: {{ event.tankLevel }}</p>
	<p>tankType: {{ event.tankType }}</p>

	<hr />
	<p>arenaWGID: {{ event.arenaWGID }}</p>
	<p>arenaTag: {{ event.arenaTag }}</p>
	<p>battleMode: {{ event.battleMode }}</p>
	<p>battleGameplay: {{ event.battleGameplay }}</p>
	<p>team: {{ event.team }}</p>
	<p>spawnPoint: {{ bd2vector(event, 'spawnPoint') }}</p>

	<hr />
	<p>dateTime: {{ event.dateTime }}</p>
	<p>loadBattlePeriod: {{ event.loadBattlePeriod }}</p>
	<p>battleLoadTimeMS: {{ event.battleLoadTimeMS }}</p>
	<p>preBattleWaitTimeMS: {{ event.preBattleWaitTimeMS }}</p>
	<p>inQueueWaitTimeMS: {{ event.inQueueWaitTimeMS }}</p>
	<p>battleTimeMS: {{ event.battleTimeMS }}</p>

	<hr />
	<p>gameVersion: {{ event.gameVersion }}</p>
	<p>gameplayMask: {{ event.gameplayMask.toString(2) }}</p>
	<p>modVersion: {{ event.modVersion }}</p>
	<p>region: {{ event.region }}</p>
	<p>serverName: {{ event.serverName }}</p>
	<p>startDispersion: {{ event.startDispersion }}</p>
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
