<template>
	<Card class="battle-card">
		<div>
			<p>Результат: {{ battle.result || 'неизвестен' }}</p>
			<p>Дата: {{ battle.dateTime }}</p>
			<p>Режим: {{ battle.battleMode }}</p>
			<p>Ник: {{ battle.playerName }}</p>
			<p>Танк: {{ battle.tankTag }}</p>
		</div>
	</Card>
</template>

<script>
import Card from '@/components/card';
export default {
	props: ['battle'],
	components: {
		Card,
	},
};
</script>

<style lang="scss" scoped>
.battle-card {
	overflow: hidden;
}
</style>
