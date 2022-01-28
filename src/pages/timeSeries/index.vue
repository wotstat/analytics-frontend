<template>
	<div class="abs-full flex">
		<BattleList
			class="overflow-y-auto"
			:battles="battles"
			:selectedBattle="selectedBattle"
			@selectBattle="selectBattle"
		/>

		<BattleInfo
			class="overflow-x-auto"
			:events="battleEvents[selectedBattle?.id]"
			:loading="battleEventsLoading[selectedBattle?.id]"
		/>
	</div>
</template>

<script>
import BattleList from './battleList/index.vue';
import BattleInfo from './battleInfo/index.vue';
import Axios from 'axios';

const baseURL = process.env.VUE_APP_SERVER_BASE_URL;

export default {
	data() {
		return {
			battles: [],
			selectedBattle: null,
			selectedEvent: null,
			battleEvents: {},
			battleEventsLoading: {},
		};
	},
	methods: {
		async load() {
			console.log(baseURL);
			const res = await Axios.get(baseURL + '/timeSeries/battles', {
				params: {
					limit: 50,
				},
			});
			this.battles = res.data;
		},
		async selectBattle(battle) {
			if (this.selectedBattle != battle) {
				this.selectedEvent = null;
			}

			this.selectedBattle = battle;
			this.battleEventsLoading[battle.id] = true;

			const res = await Axios.get(baseURL + '/timeSeries/battleEvents', {
				params: {
					battleid: battle.id,
				},
			});

			this.battleEventsLoading[battle.id] = false;
			this.battleEvents[battle.id] = res.data;
		},
	},
	mounted() {
		this.load();
	},
	components: {
		BattleList,
		BattleInfo,
	},
};
</script>
