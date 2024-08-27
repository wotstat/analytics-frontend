<template>
  <code><slot></slot>{{ gameVersionEU }}</code>
</template>

<script lang="ts" setup>
import { gameVersionEU } from "./gameVersion";
</script>