<template>
  <code><slot></slot>{{ gameVersionRU }}</code>
</template>

<script lang="ts" setup>
import { gameVersionRU } from "./gameVersion";
</script>