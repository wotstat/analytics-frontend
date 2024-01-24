<template>
	<div class="main-page abs-full">
		<Header />
		<div class="page-container">
			<router-view />
		</div>
	</div>
</template>


<script setup>

import Header from '@/components/header/index.vue';

</script>

<style lang="scss">
@import '/styles/global.scss';

@import '@/styles/wot';

.main-page {
	display: flex;
	flex-direction: column;

	.page-container {
		position: relative;
		flex: 1;
	}
}

body,
html {
	margin: 0;
	padding: 0;
}

#app {
	font-family: Inter var experimental, Inter var, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Helvetica, Arial, Noto Sans, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", Segoe UI Symbol, "Noto Color Emoji";
	font-size: 15px;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	// 	text-align: center;
	// 	color: #2c3e50;
}
</style>
