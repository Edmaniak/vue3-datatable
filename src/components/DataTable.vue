<template>
  <div class="data-table">
    <div v-if="!$slots['top']" class="data-table__top">
      <div class="data-table__search">
        <input v-model="search" type="text">
      </div>
    </div>
    <slot name="top"/>
    <div class="data-table__body">
      <div class="data-table__legend" :style="`${columnsTemplate}`">
        <div @click="sort(key.key)" :key="key.key" v-for="key in autoCollectedKeys" class="data-table__legend-item"
             :class="`data-table__legend-item-${key.key}`">
          <span class="data-table__column-title">{{ key.title }}</span>
          <span v-if="sort || key.sort" class="data-table__column-sort"
                :class="{'data-table__column-sort--asc': activeSorting[key.key] === 'ASC'}">&#9662;</span>
        </div>
      </div>
      <div class="data-table__filter" :style="`${columnsTemplate}`">
        <div class="data-table__filter-item" :key="key.key" v-for="key in autoCollectedKeys">
          <div class="data-table__filter-input">
            <input @input="updateTrigger++" v-model="searchColumns[key.key]" type="text">
          </div>
          <div class="data-table__filter-select">
            <select @select="updateTrigger++" v-model="searchColumns[key.key]">
              <option></option>
              <option :key="option" v-for="option in autoCollectedOptions[key.key]">
                {{option}}
              </option>
            </select>
          </div>
        </div>
      </div>
      <table class="data-table__table" :style="`${columnsTemplate}`">
        <tr class="data-table__row" :class="`data-table__row-${i}`" :key="i" v-for="(item, i) in filteredData">
          <td class="data-table__cell" :key="`${item}${key}`" v-for="key in autoCollectedKeys"
              :class="`data-table__cell-${key.key}`">
            {{ filteredData[i][key.key] }}
          </td>
        </tr>
      </table>
    </div>
    <div v-if="!$slots['footer']" class="data-table__footer">
      <div class="data-table__pagination">
        <div @click="setPage(1)" class="data-table__first">First</div>
        <div @click="setPage(activePage - 1)" class="data-table__prev">Prev</div>
        <div class="data-table__pages"></div>
        <div @click="setPage(activePage + 1)" class="data-table__next">Next</div>
        <div @click="setPage(pagesCount)" class="data-table__last">Last</div>
      </div>
      {{ pagesCount }}
    </div>
    <slot name="footer"/>
  </div>
</template>

<script lang="ts">
import {computed, defineComponent, PropType, ref, watch} from 'vue';
import Key from '@/model/Key';

export default defineComponent({
  name: 'DataTable',
  props: {
    /**
     * The default data feed for data table
     */
    data: {
      type: Array,
      default: () => []
    },
    keys: {
      type: Array as PropType<Array<Key>>,
      default: () => []
    },
    minColumnWidth: {
      type: String,
      default: '150px'
    },
    paginationOptions: {
      type: Array as PropType<Array<number | string>>,
      default: () => [1, 3, 5, 10, 20, 30, 40, 50, 60, 100, 200 - 1]
    },
    paginate: {
      type: Number
    },
    sort: {
      type: Boolean,
      default: true
    },
    defaultPage: {
      type: Number,
      default: 1
    },
    defaultSort: {
      type: Object as PropType<Record<string, 'ASC' | 'DESC'>>,
    }
  },
  setup (props) {

    const updateTrigger = ref<number>(0)

    // PAGINATION
    const activePagination = ref<number | undefined>(props.paginate)
    const activePage = ref<number>(props.defaultPage)
    const pagesCount = computed<number>(() => {
      return activePagination.value ? props.data.length / activePagination.value : 1
    })

    // SORTING
    const activeSorting = ref<Record<string, 'ASC' | 'DESC'>>(props.defaultSort ? props.defaultSort : {})

    // FILTERING
    const search = ref<string | null>(null)
    const searchColumns = ref<Record<string, string>>({'unit_cost': ''})

    const columnsTemplate = computed<any>(() => {
      let cssRule = 'grid-template-columns:'

      let fractions: any = {}
      props.data.forEach((d: any) => {
        Object.values(d).forEach(((value: any, i: number) => {
          if (value.toString().length > fractions[i] || !fractions[i]) {
            fractions[i] = value.toString().length
          }
        }))
      })

      fractions = Object.values(fractions)
      const sum = fractions.reduce((a: number, b: number) => a + b, 0)
      fractions
          .map((fraction: number) => fraction / sum)
          .forEach((fraction: number) => {
            cssRule += `minmax(${props.minColumnWidth}, ${fraction}fr)`
          })

      return `${cssRule};`
    })

    /**
     * Main data restriction and filtering flow
     * includes:
     * Key filtering | Sorting | Search | Filtering | Pagination
     */
    const filteredData = computed<Array<any>>(() => {
      updateTrigger.value
      let tempData = props.data

      // Removing undefined keys
      if (props.keys?.length > 0) {
        tempData.forEach((d: any) => {
          Object.keys(d).forEach((key: any) => {
            if (!props.keys?.includes(key.key) && tempData[key]) delete tempData[key]
          })
        })
      }

      // Sorting
      if (activeSorting.value) {
        Object.keys(activeSorting.value).forEach((sortKey: string) => {
          if (activeSorting.value[sortKey] === 'ASC') {
            tempData = tempData.sort((a: any, b: any) => a[sortKey].toString().localeCompare(b[sortKey].toString()))
          } else {
            tempData = tempData.sort((a: any, b: any) => b[sortKey].toString().localeCompare(a[sortKey].toString()))
          }
        })
      }

      // Search
      if (search.value) {
        tempData = tempData.filter((item: any) => Object.values(item).some((value: any) => value.toString().search(search.value) > -1))
      }

      if (searchColumns.value) {
        Object.keys(searchColumns.value).forEach((key: string) => {
          if (searchColumns.value[key]) {
            tempData = tempData.filter((item: any) => Object.values(item).some((value: any) => value.toString().search(searchColumns.value[key]) > -1))
          }
        })
      }


      // Pagination
      if (props.paginate) {
        tempData = tempData.filter((item: any, index: number) => {
          return activePagination.value && index > (activePagination.value * (activePage.value - 1)) - 1
              && index < activePagination.value * activePage.value
        })
      }


      return tempData

    })

    watch(() => searchColumns.value, (v) => {
      console.log(v)
    })

    const autoCollectedKeys = computed<Array<Key>>(() => {
      if (props.keys.length > 0) return props.keys
      if (props.data.length === 0) return []
      //@ts-ignore
      const collectedKeys = Object.keys(props.data[0]).map((key: string) => ({title: key, key}))
      props.data.forEach((d: any) => {
        Object.keys(d).forEach((key: string) => {
          if (!collectedKeys.find(ck => ck.key === key)) collectedKeys.push({key, title: key})
        })
      })
      return collectedKeys
    })

    const autoCollectedOptions = computed<Record<string, Array<string>>>(() => {
      if (props.keys.length > 0) return {}
      if (props.data.length === 0) return {}
      const collectedOptions: Record<string, Array<string>> = {}
      autoCollectedKeys.value.forEach((key: Key) => {
        Object.values(props.data).forEach((data: any) => {
          if (!Array.isArray(collectedOptions[key.key]))
            collectedOptions[key.key] = []
          if (!collectedOptions[key.key].includes(data[key.key]))
            collectedOptions[key.key].push(data[key.key])
        })
      })
      return collectedOptions
    })

    const sort = (sortKey: string, sort?: 'ASC' | 'DESC') => {
      if (activeSorting.value[sortKey]) activeSorting.value[sortKey] = activeSorting.value[sortKey] === 'ASC' ? 'DESC' : 'ASC'
      else activeSorting.value[sortKey] = sort ? sort : 'DESC'
    }

    const setPage = (page: number) => {
      if (page > 0 && page <= pagesCount.value) {
        activePage.value = page
      }

    }

    return {
      columnsTemplate,
      filteredData,
      autoCollectedKeys,
      pagesCount,
      sort,
      activePage,
      activeSorting,
      setPage,
      search,
      searchColumns,
      updateTrigger,
      autoCollectedOptions
    }
  }
})
</script>

<style lang="scss" scoped>
* {
  box-sizing: border-box;
}
.data-table {

  &__table {
    display: grid;
  }

  &__legend {
    display: grid;
    font-weight: bold;

    &-item {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      padding: 6px;
    }
  }

  &__column-sort {
    margin-left: 3px;
    cursor: pointer;

    &--asc {
      transform: rotate(180deg);
    }
  }

  &__row {
    display: contents;
  }

  &__cell {
    display: flex;
    padding: 6px;
  }

  &__filter {
    display: grid;

    &-item {
      padding: 6px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    &-input, &-select {
      width: 100%;

      input, select {
        width: 100%;
        min-width: unset;
        max-width: unset;
      }
    }
  }

  &__footer {
    display: flex;
    padding: 6px;
    justify-content: flex-end;
  }

  &__pagination {
    padding: 6px;
    display: flex;

    > div {
      cursor: pointer;
    }
  }

  &__top {
    padding: 6px;
    display: flex;
    justify-content: flex-end;
  }

}
</style>