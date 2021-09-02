<template>
	<div class="list">
		<Battle />
		<Battle />
	</div>
</template>

<script>
import Battle from './battle';
export default {
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
