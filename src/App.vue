<template>
  <div class="app-wrapper" @mousemove="mouseMove">
    <canvas id="canvas"></canvas>
    <div
      id="plane"
      :style="{
        left: `${state.planePos.left}px`,
        top: `${state.planePos.top}px`,
        display: state.planeDisplay,
      }"
    >
      <p>机柜名称：{{ state.curCabinet.name }}</p>
      <p>机柜温度：{{ state.curCabinet.temperature }}°</p>
      <p>
        使用情况：{{ state.curCabinet.count }}/{{ state.curCabinet.capacity }}
      </p>
    </div>
  </div>
  <!-- <Box></Box> -->
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import MachineRoom from './MachineRoom'
// import Box from '@/demo/Box.vue'

/** 机房对象 */
let room: MachineRoom
/** 画布对象 */
let canvas: HTMLCanvasElement

const state = reactive({
  planePos: {
    left: 200,
    top: 200,
  },
  planeDisplay: '',
  curCabinet: {
    name: 'cabinet-001',
    temperature: 36,
    capacity: 0,
    count: 0,
  },
})

onMounted(() => {
  canvas = document.getElementById('canvas') as HTMLCanvasElement

  if (!canvas) {
    return
  }
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  room = new MachineRoom(canvas)
  room.modelPath = './models/'
  room.loadGLTF('machineRoom.gltf')
  room.animate()

  room.onMouseOverCabinet = (cabinet) => {
    console.log('cabinet:', cabinet)
    //显示信息面板
    state.planeDisplay = 'block'
    state.curCabinet = {
      name: cabinet.name,
      temperature: 36,
      capacity: 38,
      count: 29,
    }
  }
  room.onMouseMoveCabinet = (left, top) => {
    //移动信息面板
    state.planePos = { left, top }
  }
  room.onMouseOutCabinet = () => {
    //显示信息面板
    state.planeDisplay = 'none'
  }
})

const mouseMove = (event: MouseEvent) => {
  room.selectCabinet(event.clientX, event.clientY)
}
</script>
<style scoped lang="scss">
.app-wrapper {
  height: 100%;
  overflow: hidden;

  #plane {
    position: absolute;
    top: 0;
    left: 0;
    display: none;
    padding: 0 18px;
    color: #fff;
    background-color: rgb(0 0 0 / 50%);
  }
}
</style>
