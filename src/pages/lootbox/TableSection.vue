<template>
  <template v-if="props.data.length > 0">
    <h4>{{ title }}</h4>
    <div class="card">
      <Table v-bind="props" :localizer="localizer" />
    </div>
  </template>
</template>

<script lang="ts" setup>
import { Status } from "@/db";
import Table from "./Table.vue";

type LocalizedName = string | [name: string, region: string][]

const props = defineProps<{
  title: string,
  status: Status,
  data: {
    title: string,
    titleName?: LocalizedName,
    count: number,
    percent: number,
    other?: number
  }[],
  localizer?: (key: string, titleName?: LocalizedName) => string | { prefix?: string, postfix?: string, value: string },
  byNumber?: number,
  leftAlign?: boolean
}>()
</script>

<style lang="scss" scoped>
h4 {
  margin-bottom: 1rem;
}
</style>