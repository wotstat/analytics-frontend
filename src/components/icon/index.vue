<template>
	<div class="icon-btn">
		<div class="back">
			<vue-feather :type="type" size="20" stroke-width="2.5"></vue-feather>
		</div>
	</div>
</template>

<script>
export default {
	props: ['type'],
};
</script>

<style lang="scss" scoped>
.icon-btn {
	cursor: pointer;
	user-select: none;
	.back {
		padding: 5px;
		display: inline-flex;
		border-radius: 7px;
	}
	.back:active {
		background: rgba(184, 184, 184, 0.459) !important;
	}

	&.selected {
		.back {
			background: rgba(209, 209, 209, 0.5);
		}
	}
}
</style>
