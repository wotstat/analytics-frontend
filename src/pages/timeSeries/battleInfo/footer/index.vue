<template>
	<div class="container flex">
		<div class="flex">
			<icon-btn type="list" :class="getClass('list')" @click="changeState('list')" />
			<icon-btn type="bar-chart-2" :class="getClass('chart')" @click="changeState('chart')" />
		</div>
	</div>
</template>

<script>
export default {
	props: ['modelValue'],
	methods: {
		changeState(state) {
			this.$emit('update:modelValue', state);
		},
		getClass(forButton) {
			return this.modelValue == forButton ? 'selected' : '';
		},
	},
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
.container {
	padding: 3px;
	border-bottom: $border-line;
	justify-content: right;
}

div {
	.icon-btn {
		margin: 0 1px;
	}
}
</style>
