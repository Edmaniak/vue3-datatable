<template>
  <img alt="Vue logo" src="./assets/logo.png">
  <DataTable :data="example" :paginate="3" :default-page="1"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import HelloWorld from './components/HelloWorld.vue';
import DataTable from '@/components/DataTable.vue';
import example from '@/assets/example';

export default defineComponent({
  name: 'App',
  components: {
    DataTable
  },
  setup() {
    return {example}
  }
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
