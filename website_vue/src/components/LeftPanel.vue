<template>
  <div class="left_panel">
      <div
        v-b-tooltip.hover.right
        :title="option"
        position="right"
        @click="chooseOption(option)"
        v-bind:class="'option' + (index === 0 ? ' border' : ' option_to_choose')"
        :key="'el' + index + option"
        v-for="(option, index) in options"
      >
        <slot></slot>
        <img v-bind:src="'/static/img/option/' + option + '.png'" class='center'/>
      </div>
  </div>
</template>

<script>
import {mapGetters, mapMutations} from 'vuex'
import {VBTooltip} from 'bootstrap-vue'

export default {
  name: 'LeftPanel',
  directives: {
    'b-tooltip': VBTooltip
  },
  data () {
    return {
      options: [
        'device',
        'home'
      ]
    }
  },
  props: {
    position: 'right',
    content: 'anything'
  },
  computed: {
    ...mapGetters([
      'chosenDeviceId',
      'chosenOption',
      'devicesTimestampsRange'
    ])
  },
  watch: {
    chosenDeviceId: {
      deep: true,
      handler (newValue) {
        if (newValue !== null) {
          this.options = [
            'device',
            'home',
            'view',
            'history',
            'calendar'
          ]
          let deviceTimestampRange = this.devicesTimestampsRange.get(this.chosenDeviceId)
          this.setRangeFrom(new Date(deviceTimestampRange.timestampFrom))
          this.setRangeTo(new Date(deviceTimestampRange.timestampTo))
        } else if (newValue === null || newValue === '') {
          this.options = ['device']
        }
      }
    },
    chosenOption: {
      deep: true,
      handler (newValue) {
        this.chooseOption(newValue)
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
      'setChosenOption',
      'setRangeFrom',
      'setRangeTo'
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
  border: green 1px solid !important;
}

.option {
  padding-top: 10px;
  padding-bottom: 10px;
  min-height: 50px;
}

.option_to_choose:hover {
  background-color: green;
}

</style>
<style scoped src="bootstrap/dist/css/bootstrap.css"></style>
<style scoped src="bootstrap-vue/dist/bootstrap-vue.css"></style>
