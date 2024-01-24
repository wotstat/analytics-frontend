<template>
	<div class="container flex flex-col">
		<Header />
		<div class="list">
			<Battle v-for="battle in battles" :key="battle.id" :battle="battle" @click="$emit('selectBattle', battle)"
				:class="selectedBattle == battle ? 'selected' : ''" />
		</div>
	</div>
</template>

<script setup>
import Battle from './battle';
import Header from './header/header.vue';




defineProps({
	battles: {
		type: Array,
		required: true,
	},
	selectedBattle: {
		type: Object,
		required: true,
	},
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.container {
	border-right: $border-line;
	background: $main-background;

	.list {
		overflow-y: auto;

		div {
			margin: 5px;
		}
	}
}
</style>
