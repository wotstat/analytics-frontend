<template>
	<div class="list">
		<Battle v-for="battle in battles" :key="battle.id" :battle="battle" />
	</div>
</template>

<script>
import Battle from './battle';
export default {
	props: ['battles'],
	components: {
		Battle,
	},
};
</script>

<style lang="scss" scoped>
.list {
	width: 300px;
	border-right: 2px solid silver;
	div {
		margin: 5px;
	}
}
</style>
