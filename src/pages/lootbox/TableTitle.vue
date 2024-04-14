<template>
  <td v-if="typeof title === 'string'" :class="leftAlign ? 'left-align' : ''">{{ title }}</td>
  <template v-else>
    <td :class="leftAlign ? 'left-align' : ''">
      <span class="prefix" v-if="title.prefix">{{ title.prefix }}</span>
      {{ title.value }}
      <span class="postfix" v-if="title.postfix">{{ title.postfix }}</span>
    </td>
  </template>
</template>

<script lang="ts" setup>

defineProps<{
  title: string | { prefix?: string, postfix?: string, value: string },
  leftAlign?: boolean
}>()

</script>

<style lang="scss" scoped>
.postfix,
.prefix {
  color: #bababa;
  font-weight: 300;
}

.left-align {
  text-align: left;

  .postfix {
    float: right;
  }
}
</style>