<template>
  <a :href="asset" target="_blank" rel="noopener noreferrer">
    <slot></slot>
  </a>
</template>


<script setup lang="ts">
import { computedAsync } from '@vueuse/core';
import { githubRelease } from './ghRelease';

const asset = computedAsync(async () => {
  const asset = await githubRelease("https://api.github.com/repos/WOT-STAT/wotstat-widgets/releases/latest", t => t.endsWith('.wotmod'))
  console.log(asset);

  return asset.browser_download_url
});



</script>
