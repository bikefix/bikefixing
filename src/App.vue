<script setup lang="ts">
  import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <a href="/" class="logo"><img alt="bikefix logo" class="logo" src="/bikefix.png" width="300" height="125" /></a>
  </header>
  <RouterView />
</template>

<style scoped>
* {box-sizing: border-box;}

body { 
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
}

header {
  overflow: hidden;
  padding: 20px 10px;
}

header a {
  color: black;
  text-align: center;
  padding: 12px;
  text-decoration: none;
  font-size: 18px; 
  line-height: 25px;
  border-radius: 4px;
}

header a.logo {
  font-size: 25px;
  font-weight: bold;
}

</style>
