<template>
  <img alt="Vue logo" src="./assets/logo.png">
  <DataTable :sort="false" :paginate="1" :data="example" :keys="keys">
    <template #cell-quantity="data">
      <b>{{data.data.item}}</b>
    </template>
  </DataTable>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import DataTable from '@/components/DataTable.vue';
import example from '@/assets/example';

export default defineComponent({
  name: 'App',
  components: {
    DataTable
  },
  setup() {
    const keys = [{key:'supplier', title: 'Dodavatel', filter: 'input'}, {key:'quantity', title: 'Pocet'}]
    return {example, keys}
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
