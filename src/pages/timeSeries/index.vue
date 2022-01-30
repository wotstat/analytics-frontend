<template>
	<div class="abs-full container">
		<BattleList
			class="overflow-y-auto z-5 fixed h-100"
			:class="selectedBattle ? 'hidden' : ''"
			:battles="battles"
			:selectedBattle="selectedBattle"
			@selectBattle="selectBattle"
		/>
		<BattleInfo
			class="abs-full overflow-x-auto z-1 info"
			:events="battleEvents[selectedBattle?.id]"
			:loading="battleEventsLoading[selectedBattle?.id]"
			@back="back"
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
		back() {
			this.selectedBattle = null;
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

<style lang="scss" scoped>
@import '@/styles/variables.scss';
.container {
	position: absolute;

	.list {
		width: 300px;
		transform: none;

		@media screen and (max-width: $time-series-width) {
			width: 100%;

			transition: transform 0.3s;

			&.hidden {
				transform: translateX(-100%);
			}
		}
	}

	.info {
		margin-left: 302px;
		@media screen and (max-width: $time-series-width) {
			margin-left: 0;
		}
	}
}
</style>
