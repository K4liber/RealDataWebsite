<template>
    <div class="main">
      <div id="time-range">
        <div id="slider-caption">
          <div id="slider-from"></div>
          <div v-if="pathMode" id="slider-to"></div>
        </div>
        <div id="slider"></div>
      </div>
    </div>
</template>

<script>
import {mapMutations, mapGetters} from 'vuex'
import $ from 'jquery'
import 'jquery-ui-bundle'
import 'jquery-ui-bundle/jquery-ui.min.css'

export default {
  name: 'LocalizationHistory',
  data () {
    return {
      pathMode: true,
      datetimeFrom: new Date(),
      datetimeTo: new Date()
    }
  },
  computed: {
    ...mapGetters([
      'historyStartDate',
      'historyStopDate',
      'localizationHistory'
    ])
  },
  mounted: function () {
    this.reload_slider()
  },
  methods: {
    reload_slider () {
      if (this.historyStartDate === null || this.historyStopDate === null) {
        return
      }

      this.datetimeFrom = this.historyStartDate
      this.datetimeTo = this.historyStopDate
      $('#slider-from').html(this.datetimeFrom.toLocaleString('pl'))
      $('#slider-to').html(this.datetimeTo.toLocaleString('pl'))
      let fromVal = this.datetimeFrom / 1000
      let toVal = this.datetimeTo / 1000
      let mapComponent = this
      $('#slider').remove()
      $('<div>', {
        id: 'slider'
      }).appendTo('#time-range')

      if (this.pathMode) {
        $('#slider').slider({
          range: true,
          min: fromVal,
          max: toVal,
          step: 10,
          values: [fromVal, toVal],
          slide: function (e, ui) {
            mapComponent.datetimeFrom = new Date(ui.values[0] * 1000)
            $('#slider-from').html(mapComponent.datetimeFrom.toLocaleString('pl'))
            mapComponent.datetimeTo = new Date(ui.values[1] * 1000)
            $('#slider-to').html(mapComponent.datetimeTo.toLocaleString('pl'))
          }
        })
      } else {
        $('#slider').slider({
          range: false,
          min: fromVal,
          max: toVal,
          step: 10,
          value: fromVal,
          slide: function (e, ui) {
            mapComponent.datetimeFrom = new Date(ui.value * 1000)
            $('#slider-from').html(mapComponent.datetimeFrom.toLocaleString('pl'))
            $('#slider-to').html('')
          }
        })
      }
    },
    ...mapMutations([
      'setSliderFrom',
      'setSliderTo'
    ])
  },
  watch: {
    localizationHistory: {
      deep: true,
      handler () {
        console.log('HERE!!!! localizationHistory ')
        this.reload_slider()
      }
    },
    datetimeFrom: {
      deep: true,
      handler (newValue, oldValue) {
        if (newValue !== oldValue) {
          this.setSliderFrom(newValue)
        }
      }
    },
    datetimeTo: {
      deep: true,
      handler (newValue, oldValue) {
        if (newValue !== oldValue) {
          this.setSliderTo(newValue)
        }
      }
    }
  }
}

</script>

<style scoped>

.main {
  z-index: 9999;
  text-align: center;
  padding: 0;
  padding-top: 5px;
  padding-left: 1%;
}

#time-range {
  width: 96%;
  top: 10px;
  font-family: "Arial", sans-serif;
  font-size: 14px;
  color: #333;
}

.ui-slider-horizontal {
  height: 8px;
  background: #D7D7D7;
  border: 1px solid #BABABA;
  box-shadow: 0 1px 0 #FFF, 0 1px 0 #CFCFCF inset;
  clear: both;
  margin: 8px 0;
  -webkit-border-radius: 6px;
  -moz-border-radius: 6px;
  -ms-border-radius: 6px;
  -o-border-radius: 6px;
  border-radius: 6px;
}

.ui-slider {
  text-align: center;
  width: 90% !important;
}

.ui-slider-horizontal .ui-slider-range {
  top: -1px;
  height: 100%;
}

.ui-slider .ui-slider-range {
  position: absolute;
  z-index: 1;
  height: 8px;
  font-size: .7em;
  display: block;
  border: 1px solid #5BA8E1;
  box-shadow: 0 1px 0 #AAD6F6 inset;
  -moz-border-radius: 6px;
  -webkit-border-radius: 6px;
  -khtml-border-radius: 6px;
  border-radius: 6px;
  background: #81B8F3;
  background-image: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgi…pZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JhZCkiIC8+PC9zdmc+IA==');
  background-size: 100%;
  background-image: -webkit-gradient(linear, 50% 0, 50% 100%, color-stop(0%, #A0D4F5), color-stop(100%, #81B8F3));
  background-image: -webkit-linear-gradient(top, #A0D4F5, #81B8F3);
  background-image: -moz-linear-gradient(top, #A0D4F5, #81B8F3);
  background-image: -o-linear-gradient(top, #A0D4F5, #81B8F3);
  background-image: linear-gradient(top, #A0D4F5, #81B8F3);
}

.ui-slider .ui-slider-handle {
  border-radius: 50%;
  background: #F9FBFA;
  background-image: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgi…pZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JhZCkiIC8+PC9zdmc+IA==');
  background-size: 100%;
  background-image: -webkit-gradient(linear, 50% 0, 50% 100%, color-stop(0%, #C7CED6), color-stop(100%, #F9FBFA));
  background-image: -webkit-linear-gradient(top, #C7CED6, #F9FBFA);
  background-image: -moz-linear-gradient(top, #C7CED6, #F9FBFA);
  background-image: -o-linear-gradient(top, #C7CED6, #F9FBFA);
  background-image: linear-gradient(top, #C7CED6, #F9FBFA);
  width: 22px;
  height: 22px;
  -webkit-box-shadow: 0 2px 3px -1px rgba(0, 0, 0, 0.6), 0 -1px 0 1px rgba(0, 0, 0, 0.15) inset, 0 1px 0 1px rgba(255, 255, 255, 0.9) inset;
  -moz-box-shadow: 0 2px 3px -1px rgba(0, 0, 0, 0.6), 0 -1px 0 1px rgba(0, 0, 0, 0.15) inset, 0 1px 0 1px rgba(255, 255, 255, 0.9) inset;
  box-shadow: 0 2px 3px -1px rgba(0, 0, 0, 0.6), 0 -1px 0 1px rgba(0, 0, 0, 0.15) inset, 0 1px 0 1px rgba(255, 255, 255, 0.9) inset;
  -webkit-transition: box-shadow .3s;
  -moz-transition: box-shadow .3s;
  -o-transition: box-shadow .3s;
  transition: box-shadow .3s;
}

.ui-slider .ui-slider-handle {
  position: absolute;
  z-index: 2;
  width: 22px;
  height: 22px;
  cursor: default;
  border: none;
  cursor: pointer;
}

.ui-slider .ui-slider-handle:after {
  content: "";
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  top: 10px;
  margin-top: -4px;
  left: 50%;
  margin-left: -4px;
  background: #30A2D2;
  -webkit-box-shadow: 0 1px 1px 1px rgba(22, 73, 163, 0.7) inset, 0 1px 0 0 #FFF;
  -moz-box-shadow: 0 1px 1px 1px rgba(22, 73, 163, 0.7) inset, 0 1px 0 0 white;
  box-shadow: 0 1px 1px 1px rgba(22, 73, 163, 0.7) inset, 0 1px 0 0 #FFF;
}

.ui-slider-horizontal .ui-slider-handle {
  top: -.5em;
  margin-left: -.6em;
}

.ui-slider a:focus {
  outline: none;
}

#slider-from {
  float: left;
  text-align: left;
  width: 48%;
  margin: 1%;
}

#slider-to {
  float: left;
  text-align: right;
  width: 48%;
  margin: 1%;
}

#slider-caption {
  width: 100%;
}

</style>
