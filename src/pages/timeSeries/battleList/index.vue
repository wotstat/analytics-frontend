<template>
	<div class="list">
		<Battle
			v-for="battle in battles"
			:key="battle.id"
			:battle="battle"
			@click="$emit('selectBattle', battle)"
			:class="selectedBattle == battle ? 'selected' : ''"
		/>
	</div>
</template>

<script>
import Battle from './battle';
export default {
	props: ['battles', 'selectedBattle'],
	components: {
		Battle,
	},
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.list {
	border-right: $border-line;
	background: $main-background;
	div {
		margin: 5px;
	}
}
</style>
