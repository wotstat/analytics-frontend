<template>
	<div class="blue">
		<div class="flex">
			<icon-btn type="list" class="selected" />
			<icon-btn type="bar-chart-2" />
		</div>
	</div>
</template>

<style lang="scss" scoped>
.blue {
	height: 40px;
	background: rgba(9, 53, 250, 0.37);
}

.flex {
	margin: 2px;
	.icon-btn {
		margin: 0 1px;
	}
}
</style>
