<template>
  <table class="hover-highlight" cellspacing="0" cellpadding="0">
    <tbody>
      <tr v-for="item in data">
        <td class="left">{{ item[0] }}</td>
        <td class="right">{{ item[1] }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">

defineProps<{
  data: (string | number)[][];
}>()

</script>

<style lang="scss" scoped>
table {
  height: fit-content;
}

tr {

  td {
    padding: 0;

    &.left {
      color: #bababa;
      font-weight: 300;
      // text-align: right;
      text-align: left;
      // padding-right: 10px;
    }

    &.right {
      text-align: right;
    }
  }
}
</style>