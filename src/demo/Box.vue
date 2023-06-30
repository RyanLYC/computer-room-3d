<template>
  <canvas id="canvas"></canvas>
</template>

<script setup lang="ts">
import {
  BoxGeometry,
  Mesh,
  MeshNormalMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three'
import { onMounted } from 'vue'

onMounted(() => {
  const scene = new Scene()
  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )

  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const renderer = new WebGLRenderer({ canvas })

  const geometry = new BoxGeometry()
  const material = new MeshNormalMaterial()
  const cube = new Mesh(geometry, material)
  scene.add(cube)

  camera.position.z = 5
  const animate = () => {
    requestAnimationFrame(animate)

    cube.rotation.x += 0.01
    cube.rotation.y += 0.01

    renderer.render(scene, camera)
  }
  animate()
})
</script>
<!-- <style scoped></style> -->
