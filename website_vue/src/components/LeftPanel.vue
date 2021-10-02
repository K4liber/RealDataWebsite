<template>
  <div class="left_panel">
      <div
        @click="chooseOption(option)"
        v-bind:class="'option' + (index === 0 ? ' border' : '')"
        :key="'el' + index + option"
        v-for="(option, index) in options"
      >
        <img v-bind:src="'/static/img/' + option + '.png'" class='center'/>
      </div>
  </div>
</template>

<script>
import {mapGetters, mapMutations} from 'vuex'

export default {
  name: 'LeftPanel',
  data () {
    return {
      options: [
        'device',
        'calendar',
        'range'
      ]
    }
  },
  computed: {
    ...mapGetters([
      'chosenDeviceId'
    ])
  },
  watch: {
    chosenDeviceId: {
      deep: true,
      handler (newValue) {
        if (newValue !== null && !this.options.includes('view')) {
          this.options.push('view')
        } else if (newValue === null && this.options.includes('view')) {
          this.options.remove('view')
        }
      }
    }
  },
  methods: {
    chooseOption: function (option) {
      let optionsNewOrder = this.options.slice(0, this.options.length)
      let chosenIndex = this.options.indexOf(option)
      optionsNewOrder[chosenIndex] = this.options[0]
      optionsNewOrder[0] = option
      this.options = optionsNewOrder
      this.setChosenOption(option)
    },
    ...mapMutations([
      'setChosenOption'
    ])
  }
}

</script>
<style scoped>

.left_panel {
    position: relative;
    float: left;
    padding: 0;
    margin: 0;
    width: 50px;
    height: 100%;
    background-color: rgba(230, 230, 230, 1.0);
}

.center {
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 50%;
  height: 100%;
}

.border {
  border: green 1px solid;
}

.option {
  padding-top: 10px;
  padding-bottom: 10px;
  height: 28px;
}

.option:hover {
  background-color: green;
}

</style>
