<template>
  <div class="data-table">
    <div v-if="!$slots['top']" class="data-table__top">
      <div v-if="showSearch" class="data-table__search">
        <label class="data-table__search-label">{{ localization.searchLabel }}</label>
        <input class="data-table__search-input" v-model="searchInput" :placeholder="localization.searchPlaceholder"
               type="text">
      </div>
    </div>
    <slot name="top"/>
    <div class="data-table__body">
      <div v-if="legend" class="data-table__legend" :style="`${columnsTemplate}`">
        <div :key="key.key" v-for="key in autoCollectedKeys" class="data-table__legend-item"
             :class="`data-table__legend-item-${key.key}`">
          <span @click="sortData(key.key)" class="data-table__column-title">{{ key.title || key.key }}</span>
          <template v-if="sort || key.sort">
            <span @click="sortData(key.key)" class="data-table__column-sort"
                  :class="{'data-table__column-sort--asc': activeSorting[key.key] === 'ASC'}">&#9662;</span>
            <span class="data-table__cancel-sort" v-if="activeSorting[key.key]" @click="cancelSort(key.key)">✕</span>
          </template>
        </div>
      </div>
      <div v-if="showFilter || autoCollectedKeys.some(key => key.hasOwnProperty('filter'))" class="data-table__filter"
           :style="`${columnsTemplate}`">
        <div class="data-table__filter-item" :key="key.key" v-for="key in autoCollectedKeys">
          <div v-if="showFilter?.includes('input') || key.filter?.includes('input')" class="data-table__filter-input">
            <input @input="updateTrigger++" v-model="searchColumns[key.key]" type="text">
          </div>
          <div v-if="showFilter?.includes('select') || key.filter?.includes('select')" class="data-table__filter-select">
            <select @select="updateTrigger++" v-model="searchColumns[key.key]">
              <option>{{ localization.noOption }}</option>
              <option :key="option" v-for="option in autoCollectedOptions[key.key]">
                {{ option }}
              </option>
            </select>
          </div>
        </div>
      </div>
      <table class="data-table__table" :style="`${columnsTemplate}`">
        <tr class="data-table__row" :class="`data-table__row-${i}`" :key="i" v-for="(item, i) in filteredData">
          <template :key="`${item}${key}`" v-for="key in autoCollectedKeys">
            <td v-if="!$slots[`cell-${key.key}`]" class="data-table__cell" :class="`data-table__cell-${key.key}`">
              {{ filteredData[i][key.key] }}
            </td>
            <td v-else class="data-table__cell">
              <slot :name="`cell-${key.key}`"
                    v-bind:data="{data: filteredData, index: i, item: filteredData[i][key.key]}"/>
            </td>
          </template>
        </tr>
      </table>
    </div>
    <div v-if="!$slots['footer']" class="data-table__footer">
      <div class="data-table__status">
        <span>{{ activePage }}</span><span>&nbsp;{{ localization.statusOf }}&nbsp;</span><span>{{ pagesCount }}</span>
      </div>
      <div v-if="paginate" class="data-table__pagination">
        <div @click="setPage(1)" class="data-table__first" :class="{'disabled': activePage === 1}">
          <template v-if="!$slots['pagination-first']">{{ localization.firstPage }}</template>
          <slot v-else name="pagination-first"/>
        </div>
        <div @click="setPage(activePage - 1)" class="data-table__prev" :class="{'disabled': activePage === 1}">
          <template v-if="!$slots['pagination-prev']">{{ localization.prevPage }}</template>
          <slot v-else name="pagination-prev"/>
        </div>
        <div class="data-table__pages">
          <template v-if="!$slots['pagination-pages']"></template>
          <slot v-else name="pagination-pages"/>
        </div>
        <div @click="setPage(activePage + 1)" class="data-table__next" :class="{'disabled': activePage === pagesCount}">
          <template v-if="!$slots['pagination-next']"> {{ localization.nextPage }}</template>
          <slot v-else name="pagination-next"/>
        </div>
        <div @click="setPage(pagesCount)" class="data-table__last" :class="{'disabled': activePage === pagesCount}">
          <template v-if="!$slots['pagination-last']">{{ localization.lastPage }}</template>
          <slot v-else name="pagination-last"/>
        </div>
      </div>
    </div>
    <slot name="footer"/>
  </div>
</template>

<script lang="ts">
import {computed, defineComponent, PropType, ref, watch} from 'vue';
import Key from '@/model/Key';
import Localization from '@/model/Localization';
import en from '@/locales/en';
import Events from '@/model/Events';

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
    /**
     * Columns settings for data
     * includes filtering, sorting
     */
    keys: {
      type: Array as PropType<Array<Key>>,
      default: () => []
    },
    /**
     * Minimum column width for column. Maximum width is calculated from fraction.
     */
    minColumnWidth: {
      type: String,
      default: '150px'
    },
    /**
     * The number of items on one page. It also serves as information about paginating at all.
     */
    paginate: {
      type: Number
    },
    /**
     * Allows sorting for each individual column. It is overrided when there is "sort" option on
     * specific key in keys prop.
     */
    sort: {
      type: Boolean,
      default: true
    },
    /**
     * Sets filtering option. It accepts strings "input" and "select" with whatever divider.
     * It then allows the filtering options accordingly.
     */
    showFilter: {
      type: String
    },
    /**
     * Defines model of individual column filter.
     */
    filter: {
      type: Object
    },
    /**
     * Defines the model of search input from outside scope.
     */
    search: {
      type: String || null,
      default: null
    },
    /**
     * Shows the search input.
     */
    showSearch: {
      type: Boolean,
      default: false
    },
    /**
     * Sets the default page. Works only if the pagination is allowed.
     */
    page: {
      type: Number,
      default: 1
    },
    /**
     * Triggers visibility for legend
     */
    legend: {
      type: Boolean,
      default: true
    },
    /**
     * Default sort options for columns. Works only with sort option turned on.
     */
    defaultSort: {
      type: Object as PropType<Record<string, 'ASC' | 'DESC'>>,
    },
    /**
     * Allows to localize all the texts used by data table.
     */
    localization: {
      type: Object as PropType<Localization>,
      default: () => en
    }
  },
  setup (props, {emit}) {

    const updateTrigger = ref<number>(0)

    // PAGINATION
    const activePagination = ref<number | undefined>(props.paginate)
    const activePage = ref<number>(props.page)
    const pagesCount = computed<number>(() => {
      return activePagination.value ? Math.ceil(filteredData.value.length / activePagination.value) : 1
    })

    // SORTING
    const activeSorting = ref<Record<string, 'ASC' | 'DESC'>>(props.defaultSort ? props.defaultSort : {})

    // FILTERING
    const searchInput = ref<string | null>(props.search)
    const searchColumns = ref<Record<string, string>>(props.filter || {})

    const columnsTemplate = computed<string>(() => {
      let cssRule = 'grid-template-columns:'

      let fractions: any = {}
      props.data.forEach((d: any) => {
        autoCollectedKeys.value.forEach(((key: Key, i: number) => {
          if (d[key.key].toString().length > fractions[i] || !fractions[i]) {
            fractions[i] = d[key.key].toString().length
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
      if (searchInput.value) {
        tempData = tempData.filter((item: any) => Object.values(item).some((value: any) => value.toString().search(searchInput.value) > -1))
        emit(Events.SEARCH, {search: searchInput.value, data: filteredData})
        emit(Events.UPDATE_SEARCH, searchInput.value)
      }

      if (searchColumns.value) {
        Object.keys(searchColumns.value).forEach((key: string) => {
          if (searchColumns.value[key]) {
            tempData = tempData.filter((item: any) => Object.values(item).some((value: any) => value.toString().search(searchColumns.value[key]) > -1))
          }
        })
        emit(Events.COLUMN_SEARCH, {search: searchColumns.value, data: filteredData})
        emit(Events.UPDATE_FILTER, searchColumns.value)
      }


      // Pagination
      if (props.paginate) {
        tempData = tempData.filter((item: any, index: number) => {
          return activePagination.value && index > (activePagination.value * (activePage.value - 1)) - 1
              && index < activePagination.value * activePage.value
        })
      }

      emit(Events.CHANGE, {data: filteredData})
      return tempData

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

    const sortData = (sortKey: string, sort?: 'ASC' | 'DESC') => {
      if (activeSorting.value[sortKey]) activeSorting.value[sortKey] = activeSorting.value[sortKey] === 'ASC' ? 'DESC' : 'ASC'
      else activeSorting.value[sortKey] = sort ? sort : 'DESC'
      emit(Events.SORT_CHANGED, {sort: activeSorting.value, data: filteredData})
    }

    const cancelSort = (sortKey: string) => {
      delete activeSorting.value[sortKey]
    }

    const setPage = (page: number) => {
      if (page > 0 && page <= pagesCount.value) {
        emit(Events.PAGE_CHANGED, {page, data: filteredData})
        emit(Events.UPDATE_PAGE, page)
      }
    }

    watch(() => props.page, page => activePage.value = page)
    watch(() => props.search, text => searchInput.value = text)

    return {
      columnsTemplate,
      filteredData,
      autoCollectedKeys,
      pagesCount,
      sortData,
      activePage,
      activeSorting,
      setPage,
      searchInput,
      searchColumns,
      updateTrigger,
      autoCollectedOptions,
      cancelSort
    }
  },
  emits: [
    Events.PAGE_CHANGED,
    Events.CHANGE,
    Events.SORT_CHANGED,
    Events.UPDATE_PAGE,
    Events.SEARCH,
    Events.COLUMN_SEARCH,
    Events.UPDATE_SEARCH,
    Events.UPDATE_FILTER
  ]
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

  &__cancel-sort {
    cursor: pointer;
    margin-left: 3px;
  }

  &__row {
    display: contents;
  }

  &__cell {
    display: flex;
    padding: 6px;
  }

  &__search-label {
    display: block;
    text-align: left;
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
    user-select: none;

    > div {
      cursor: pointer;
      margin: 0 3px;
    }
  }

  &__status {
    padding: 6px;
  }

  &__top {
    padding: 6px;
    display: flex;
    justify-content: flex-end;
  }

  .disabled {
    color: #BBBBBB;
    pointer-events: none;
  }

}
</style>