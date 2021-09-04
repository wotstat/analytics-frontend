<template>
	<div class="abs-full">
		<BattleList :battles="battles" />
	</div>
</template>

<script>
import BattleList from './battleList/index.vue';
import Axios from 'axios';

export default {
	data() {
		return {
			battles: [],
		};
	},
	methods: {
		async load() {
			console.log(process.env.VUE_APP_SERVER_BASE_URL);
			const res = await Axios.get(process.env.VUE_APP_SERVER_BASE_URL + '/timeSeries/load', {
				params: {
					limit: 50,
				},
			});
			this.battles = res.data;
		},
	},
	mounted() {
		this.load();
	},
	components: {
		BattleList,
	},
};
</script>
