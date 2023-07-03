import {
  MeshBasicMaterial,
  MeshStandardMaterial,
  Mesh,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Texture,
  TextureLoader,
  WebGLRenderer,
  Vector2,
  Color,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

/**GLTF 模型加载器
 * GLTF 模型文件包含了整个场景的数据。比如几何体、材质、动画、相机等
 * 包含以下文件 gltf 模型文件 bin文件 贴图文件
 * 同一类型的模型文件可以放入一个数组里，数组可以多层嵌套
 */
const gltfLoader: GLTFLoader = new GLTFLoader()
/** 射线投射器，可基于鼠标点和相机，在世界坐标系内建立一条射线，用于选中模型 */
const raycaster = new Raycaster()
/** 鼠标在裁剪空间中的点位 */
const pointer = new Vector2()

export default class MachineRoom {
  /** 渲染器 */
  renderer: WebGLRenderer
  /** 实例化 场景 */
  scene: Scene = new Scene()
  /**摄像机 */
  camera: PerspectiveCamera
  /**相机轨道控制器 */
  controls: OrbitControls
  /**存放模型文件的目录 */
  modelPath: string
  /** 纹理集合 */
  maps: Map<string, Texture> = new Map()
  /**机柜集合 */
  cabinets: Mesh[] = []
  /**鼠标滑入的机柜 */
  curCabinet: Mesh | null = null

  /**鼠标划入机柜事件 参数为机柜对象 */
  onMouseOverCabinet = (cabinet: Mesh) => {}
  /** 鼠标机柜上移动事件， 参数为鼠标在 canvas 的坐标 */
  onMouseMoveCabinet = (x: number, y: number) => {}
  /** 鼠标划出机柜的事件 */
  onMouseOutCabinet = () => {}

  // 初始化场景
  constructor(canvas: HTMLCanvasElement, modelPath: string = './models/') {
    /** 实例化 渲染器 */
    this.renderer = new WebGLRenderer({ canvas })
    /** 实例化 透视 相机 */
    this.camera = new PerspectiveCamera(
      45, // 透视相机 视椎体的 垂直 夹角
      canvas.width / canvas.height, // 相机 视口的 宽高比
      0.1, //相机的 近裁剪距离
      1000 // 元裁剪距离
    )
    /** 默认视点  */
    this.camera.position.set(0, 10, 15)
    /** 相机 看向 0 点 */
    this.camera.lookAt(0, 0, 0)
    /**实例化相机轨道控制器 */
    this.controls = new OrbitControls(
      this.camera, // 相机
      this.renderer.domElement // canvas 对象
    )
    // 存储模型文件目录
    this.modelPath = modelPath

    /** 机柜 高亮 贴图 */
    // this.maps.set(
    //   'cabinet-hover.jpg',
    //   new TextureLoader().load(`${modelPath}cabinet-hover.jpg`)
    // )
    this.crtTexture('cabinet-hover.jpg')
  }

  /*
   * 加载GLTF 模型方法
   * modelName ： 模型名称
   */
  loadGLTF(modelName: string = '') {
    gltfLoader.load(this.modelPath + modelName, ({ scene: { children } }) => {
      // GLTF Loader 默认使用 MeshStandardMaterial 标准网格材质 一种基于物理的标准材质，使用Metallic-Roughness工作流程。该材质提供了比MeshLambertMaterial 或MeshPhongMaterial 更精确和逼真的结果
      // 这里直接使用贴图 无需要 光照
      children.forEach((obj) => {
        const { color, map, name } = (obj as Mesh)
          .material as MeshStandardMaterial
        this.changeMat(obj as Mesh, map, color)
        if (name.includes('cabinet')) {
          this.cabinets.push(obj as Mesh)
        }
      })
      // console.log('gltp children:', ...children)
      this.scene.add(...children)
    })
  }
  /**修改材质 */
  changeMat(obj: Mesh, map: Texture | null, color: Color) {
    // MeshBasicMaterial 不受光照影响
    // 有贴图
    if (map) {
      obj.material = new MeshBasicMaterial({
        map: this.crtTexture(map.name),
      })
    } else {
      obj.material = new MeshBasicMaterial({ color })
    }
  }
  /**建立纹理对象 */
  crtTexture(imgName: string) {
    let curTexture = this.maps.get(imgName)
    if (!curTexture) {
      curTexture = new TextureLoader().load(this.modelPath + imgName)
      curTexture.flipY = false
      // ST 方向 重复
      curTexture.wrapS = 1000
      curTexture.wrapT = 1000
      this.maps.set(imgName, curTexture)
    }
    return curTexture
  }

  /**选择机柜 */
  selectCabinet(x: number, y: number) {
    const { cabinets, renderer, camera, maps, curCabinet } = this
    const { width, height } = renderer.domElement

    // 鼠标的canvas坐标转裁剪坐标
    pointer.set((x / width) * 2 - 1, -(y / height) * 2 + 1)
    // 基于鼠标点和相机设置射线投射器
    raycaster.setFromCamera(pointer, camera)
    // 选择机柜
    const intersect = raycaster.intersectObjects(cabinets)[0]
    const intersectObj = intersect ? (intersect.object as Mesh) : null
    // 若之前已有机柜被选择，且不等于当前所选择的机柜，取消已选机柜的高亮
    if (curCabinet && curCabinet !== intersectObj) {
      const material = curCabinet.material as MeshBasicMaterial
      material.setValues({
        map: maps.get('cabinet.jpg'),
      })
    }
    /*
    若当前所选对象不为空：
      触发鼠标在机柜上移动的事件。
      若当前所选对象不等于上一次所选对象：
        更新curCabinet。
        将模型高亮。
        触发鼠标划入机柜事件。
    否则：
      置空curCabinet。
      触发鼠标划出机柜事件。
    */
    if (intersectObj) {
      this.onMouseMoveCabinet(x, y)
      if (intersectObj !== curCabinet) {
        this.curCabinet = intersectObj
        const material = intersectObj.material as MeshBasicMaterial
        material.setValues({
          map: maps.get('cabinet-hover.jpg'),
        })
        this.onMouseOverCabinet(intersectObj)
      }
    } else if (curCabinet) {
      this.curCabinet = null
      this.onMouseOutCabinet()
    }
  }
  // // 渲染
  // render() {
  //   this.renderer.render(this.scene, this.camera)
  // }
  /**连续渲染 */
  animate() {
    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame(() => {
      this.animate()
    })
  }
}
