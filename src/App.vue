<template>
  <img alt="Vue logo" src="./assets/logo.png">
  <DataTable v-model:search="search" v-model:page="page" :sort="false" :paginate="2" :data="data" :keys="keys">
    <template #cell-quantity="data">
      <b>{{data.data.item}}</b>
    </template>
  </DataTable>
  <input v-model="search"/>
</template>

<script lang="ts">
import {defineComponent, ref} from 'vue';
import DataTable from '@/components/DataTable.vue';
import example from '@/assets/example';

export default defineComponent({
  name: 'App',
  components: {
    DataTable
  },
  setup() {
    const keys = [{key:'product_name'}, {key:'supplier', title: 'Dodavatel', showFilter: 'input', sort: 'ASC'}, {key:'quantity', title: 'Pocet'}]
    const data = ref<Array<any>>(example)
    const page = ref(1)
    const search = ref('W')
    setTimeout(() => {
      data.value[0].product_name = 'Adam'
    },2000)
    return {data, keys, page, search}
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
