<template>
	<p>result: {{ event.result }}</p>
	<p>credits: {{ event.credits }}</p>
	<p>xp: {{ event.xp }}</p>
	<p>durationMs: {{ event.durationMs }}</p>
	<p>botsCount: {{ event.botsCount }}</p>
	<p>reason: {{ event.reason }}</p>
</template>

<script>
export default {
	props: ['event'],
};
</script>
