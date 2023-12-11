<template>
<!--  <div class="row">-->
<!--    <table class="col-4">-->
<!--      <tr v-for="row in this.world" :key="row">-->
<!--        <td v-for="column in row" :key="column" :class="{ red: column == 1 }"></td>-->
<!--      </tr>-->
<!--    </table>-->

  <div class="constructor round-corner-sm  col-10 p-0 m-auto position-relative h-100 shadow">
    <div class="round-corner-sm constructor-menu col-xl-9 col-md-9 m-3 shadow p-3 position-absolute start-50 translate-middle">
      <div class="col-md-12 row">
        <div class="constructor-color-list-item col-md-1" v-for="color in colors" :key="color.id"
             v-bind:class="{'selected': selectedColor == color.id }" @click="changeColor(color.id)">
          <img :src="color.path" class="w-100 h-100" />
        </div>
      </div>
      <div class="row">

<!--        <div class=" col-md-6 price-footer row ">-->
<!--          <h4 class="col-2 text-start mb-0">Цена:</h4>-->
<!--          <span class="col-10 text-end mb-0">{{ price }} руб.</span>-->
<!--        </div>-->
      </div>

    </div>
    <div class="round-corner-sm constructor-canvas" 
      @drop="onDrop()"
      @dragover.prevent
      @dragenter.prevent>
      <Renderer ref="renderer" class="w-100 h-100" resize="window" >
        <Camera ref="camera" :position="{ z: 60, x:0, y:0 }"/>
        <Scene background="#ffffff" ref="scene" >
        </Scene>
      </Renderer>
    </div>
    <div class="constructor-action-bar shadow position-absolute top-0 end-0 m-3 row p-1">
      <div class="bar-item col-6">
        <font-awesome-icon icon="ruler-horizontal" />
      </div>
      <div class="bar-item col-6 " :class="{ active: mode == 'create' }" @click="changeMode()">
        <font-awesome-icon icon="cube" />
      </div>
    </div>
    <div class="round-corner-sm constructor-module-list shadow col-xl-auto col-md-1 p-2 pt-4 pb-4 m-3 position-absolute top-50 end-0 translate-middle-y">
      <div class="constructor-module-list-item w-100" v-for="module in module_types" :key="module.key" draggable="true">
        <img :src="module.path" class="w-100" @dragstart="onDragStart($event, module.id)" />
        <div class="text-center w-100 ">{{ module.name }}</div>
      </div>
    </div>
  </div>

  
  
</template>
<script>
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
// import { gsap } from 'gsap';
import * as THREE from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import TextSprite from '@seregpie/three.text-sprite';
import { toRaw } from 'vue';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import CameraControls from 'camera-controls';

CameraControls.install( { THREE: THREE } );

export default {
  name: 'MyConstructor',
  props: {
    msg: String,
  },
  mounted() {
    
    let scene = this.$refs.scene
    this.camera = this.$refs.camera.camera
    this.camera.up.set(0, 0, 1);
    this.scene = scene

    var renderer = this.$refs.renderer.renderer

    renderer.capabilities.getMaxAnisotropy()
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;

    this.orbitCtrl = new OrbitControls( this.camera, renderer.domElement )
    this.orbitCtrl.update()
    this.orbitCtrl.target.set(0,1,0);
    this.orbitCtrl.saveState();
    this.orbitCtrl.maxPolarAngle = Math.PI / 3

    this.orbitCtrl.enabled = false;
    this.orbitCtrl.reset();
    const vect3 = new THREE.Vector3(-1,0,0);
    this.orbitCtrl.target = vect3;
    this.camera.lookAt(vect3);
    this.orbitCtrl.enabled = true;

    let light = new THREE.DirectionalLight( 0xfdfbf2, 0.4);
    light.shadow.mapSize.x = 1024
    light.shadow.mapSize.y = 1024
    light.position.set(20, 20, 120)
    light.castShadow = true;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    light.shadow.camera.left = -100;
    light.shadow.camera.right = 100;
    light.shadow.radius = 5
    light.shadow.blurSamples = 50
    scene.add( light );

    const light2 = new THREE.HemisphereLight( 0xfbf8e6, 0xcecece, 0.5 );
    scene.add( light2 );


    var planeGeometry = new THREE.PlaneGeometry(1000,1000);
    var planeMaterial = new THREE.MeshStandardMaterial( { color: 0xFFFFFF} );
    var texture = THREE.ImageUtils.loadTexture(this.tp)
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 20, 20 );
    // planeMaterial.opacity = 0.2;
    planeMaterial.map = texture
    var plane = new THREE.Mesh(planeGeometry,planeMaterial);
    plane.receiveShadow = true;
    scene.add(plane)

    this.dragCtrl = new DragControls(this.modules, this.camera, renderer.domElement );
    this.dragCtrl.addEventListener('dragstart', this.onObjectDragStart);
    this.dragCtrl.addEventListener('drag', this.onObjectDrag);
    this.dragCtrl.addEventListener('dragend', this.onObjectDragEnd);

    this.lcDragCtrl = new DragControls(this.attrControls.controls, this.camera, renderer.domElement );
    this.lcDragCtrl.addEventListener('dragstart', this.onControlDragStart);
    this.lcDragCtrl.addEventListener('drag', this.onControlDrag);
    // this.lcDragCtrl.addEventListener('dragend', this.onControlDragEnd);

    this.orbitCtrl.enableRotate = false
    this.dragCtrl.activate();
    this.cameraTotop()

  },
  setup() {

  },
  data () {
    return {
      world: Array(100).fill().map(()=>Array(100).fill(0)),
      tp: require('@/assets/materials/floor.jpg'),
      scene: null,
      cameraCtrl: null,
      camera: null,
      startPosition: null,
      gridHelper: null,
      orbitCtrl: null,
      dragCtrl: null,
      xformCtrl: null,
      mode: 'create',
      draggableObject: null,
      controls: null,
      cameraState: null,
      dragbleModuleId: null,
      selectedColor: 2,
      price: 129000,
      attrControls: {
        text_axis_x: null,
        text_axis_y: null,
        line: null,
        controls: []
      },
      colors: [
        {
          "id": 1,
          "path": require('@/assets/materials/loft000_570x480.jpg'),
        },
        {
          "id": 2,
          "path": require('@/assets/materials/loft111_570x480.jpg'),
        },
        {
          "id": 3,
          "path": require('@/assets/materials/loft230_570x480.jpg'),
        },
        {
          "id": 4,
          "path": require('@/assets/materials/loft232_570x4802.jpg'),
        },
        {
          "id": 5,
          "path": require('@/assets/materials/loft560_570x480.jpg'),
        },
        {
          "id": 6,
          "path": require('@/assets/materials/loft696_570x480.jpg'),
        },
        {
          "id": 7,
          "path": require('@/assets/materials/loft787_570x480.jpg'),
        },
        {
          "id": 8,
          "path": require('@/assets/materials/loft900_570x480.jpg'),
        },
        {
          "id": 9,
          "path": require('@/assets/materials/loft910_570x480.jpg'),
        },
        {
          "id": 10,
          "path": require('@/assets/materials/loft920_570x480.jpg'),
        },
        {
          "id": 11,
          "path": require('@/assets/materials/loft995_570x480.jpg'),
        },
        {
          "id": 12,
          "path": require('@/assets/materials/loft998_570x480.jpg'),
        }
      ],
      modules: [],
      module_types: [
        {
          id: 1,
          name: "Спинка",
          path: require('@/assets/modules/1.jpg'),
          model_path: '/models/2x10x7_mar.FBX'
        },{
          id: 2,
          name: "Основной",
          path: require('@/assets/modules/2.jpg'),
          model_path: '/models/14x8x4_mar.FBX'
        },{
          id: 3,
          name: "Подлокотник",
          path: require('@/assets/modules/3.jpg'),
          model_path: '/models/2x10x5,5_mar.FBX'
        }
      ],
    }
  },
  methods: {
    clearControlHelpers(){
      var scene = this.$refs.scene
      scene.remove(toRaw(this.attrControls.text_axis_y))
      scene.remove(toRaw(this.attrControls.text_axis_x))
      scene.remove(toRaw(this.attrControls.line))
      scene.remove(toRaw(this.attrControls.controls[0]))
      scene.remove(toRaw(this.attrControls.controls[1]))
      scene.remove(toRaw(this.attrControls.controls[2]))
      scene.remove(toRaw(this.attrControls.controls[3]))
      this.attrControls.text_axis_y = null
      this.attrControls.text_axis_x = null
      this.attrControls.line = null
      this.attrControls.controls.length = 0
    },
    showSizesLines(object){
      var scene = this.$refs.scene
      var box = new THREE.Box3().setFromObject(object);
      var geometry = new LineGeometry();
      var pointArr = [
        box.max.x, box.max.y, box.max.z,
        box.min.x, box.max.y, box.max.z,
        box.min.x, box.min.y, box.max.z,
        box.max.x, box.min.y, box.max.z,
        box.max.x, box.max.y, box.max.z,
      ]
      geometry.setPositions( pointArr);
      var material  = new LineMaterial( {color: 0xdd2222,linewidth: 5,});
      material.resolution.set(window.innerWidth,window.innerHeight);
      var line = new Line2(geometry, material);
      line.name = 'line'
      let sprite = new TextSprite({
        text: (Math.round(box.max.y - box.min.y) / 2 * 10).toString(),
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: 1,
        color: '#FF0000',
      });
      sprite.position.set(
        box.max.x - 1,
        box.max.y - (box.max.y - box.min.y) / 2,
        box.max.z
      )
      sprite.name = 'text_axis_y'
      let sprite2 = new TextSprite({
        text: (Math.round(box.max.x - box.min.x) / 2 * 10).toString(),
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: 1,
        color: '#FF0000',
      })
      sprite2.position.set(
        box.max.x - (box.max.x - box.min.x) / 2,
        box.max.y - 1.5,
        box.max.z
      )
      sprite2.name = 'text_axis_x'
      if (this.attrControls.line != null){
        scene.remove(toRaw(this.attrControls.text_axis_y))
        scene.remove(toRaw(this.attrControls.text_axis_x))
        scene.remove(toRaw(this.attrControls.line))
      }
      this.attrControls.text_axis_y = sprite
      this.attrControls.text_axis_x = sprite2
      this.attrControls.line = line
      scene.add(sprite)
      scene.add(sprite2)
      scene.add(line)
    },
    showModuleActions(event) {
      var scene = this.$refs.scene
      if (this.attrControls.line == null) {
        this.showSizesLines(event.object)
        var box = new THREE.Box3().setFromObject(event.object);
        const sphere = this.getSphere('right', box, event.object.uuid)
        const sphere2 = this.getSphere('top', box, event.object.uuid)
        const sphere3 = this.getSphere('bottom', box, event.object.uuid)
        const sphere4 = this.getSphere('left', box, event.object.uuid)

        this.attrControls.controls[0] = sphere
        this.attrControls.controls[1] = sphere2
        this.attrControls.controls[2] = sphere3
        this.attrControls.controls[3] = sphere4
        scene.add(sphere)
        scene.add(sphere2)
        scene.add(sphere3)
        scene.add(sphere4)
      } else {
        this.clearControlHelpers()
      }
    },
    getSphere(arrow, box, objectId){
      const geometry = new THREE.SphereGeometry( 0.5, 16, 16 );
      const material = new THREE.MeshBasicMaterial( { color: '#cecece' } );
      const sphere = new THREE.Mesh( geometry, material );
      if (arrow == 'bottom') {
        sphere.position.set(
          box.max.x + 1,
          box.max.y - (box.max.y - box.min.y) / 2,
          box.max.z + 0.5
        )
        if (!this.checkWord([box.max.x+51, box.max.y+50],[box.min.x+50, box.min.y+50])){
          sphere.visible = false
        }
      } else if (arrow == 'left') {
        sphere.position.set(
          box.max.x - (box.max.x - box.min.x) / 2,
          box.min.y - 1,
          box.max.z + 0.5
        )
        if (!this.checkWord([box.max.x+50, box.max.y+50],[box.min.x+50, box.min.y+49])){
          sphere.visible = false
        }
      } else if (arrow == 'right') {
        sphere.position.set(
          box.max.x - (box.max.x - box.min.x) / 2,
          box.max.y + 1,
          box.max.z + 0.5
        )
        if (!this.checkWord([box.max.x+50, box.max.y+51],[box.min.x+50, box.min.y+50])){
          sphere.visible = false
        }

      } else {
        sphere.position.set(
          box.min.x - 1,
          box.max.y - (box.max.y - box.min.y) / 2,
          box.max.z + 0.5
        )
        if (!this.checkWord([box.max.x+50, box.max.y+50],[box.min.x+49, box.min.y+50])){
          sphere.visible = false
        }
      }
      sphere.isDraggable = true;
      sphere.moduleId = objectId
      sphere.arrow = arrow
      return sphere
    },
    onControlDragStart(event){
      event.object.cposition = Object.assign({}, toRaw(event.object.position))
      event.object.last_position = Object.assign({}, toRaw(event.object.position))

    },
    onControlDrag(event){
      var pos = event.object.cposition
      for (var i = 0; i < this.modules.length; i++ ){
          if (this.modules[i].uuid == event.object.moduleId){
            var pobject = this.modules[i]
          }
      }
      switch(event.object.arrow) {
        case 'right':
        case 'left':
          event.object.position.y = Math.round(event.object.position.y)
          event.object.position.x = pos.x
          event.object.position.z = pos.z
          if (Math.round(event.object.last_position.y) != Math.round(event.object.position.y)){
            var sign = Math.round(event.object.position.y) - Math.round(event.object.last_position.y)
            if (event.object.last_position.y <= 0){
              sign *= -1
            }

            var sc = pobject.sc

            pobject.scale.y += sc.y * sign
            if (event.object.last_position.y <= 0) {
              pobject.position.y -= pobject.position_delta.y / 4 * sign
              this.attrControls.controls[1].position.y -= pobject.position_delta.y / 2 * sign
              this.attrControls.controls[2].position.y -= pobject.position_delta.y / 2 * sign
            } else {
              pobject.position.y += pobject.position_delta.y / 4 * sign
              this.attrControls.controls[1].position.y += pobject.position_delta.y / 2 * sign
              this.attrControls.controls[2].position.y += pobject.position_delta.y / 2 * sign
            }



            this.showSizesLines(pobject)
            event.object.last_position = Object.assign({}, toRaw(event.object.position))
          }
          break
        case 'top':
        case 'bottom':
          event.object.position.y = pos.y
          event.object.position.z = pos.z

          event.object.position.x = Math.round(event.object.position.x)
          break
      }
    },
    // onControlDragEnd(event){
    //   console.log(event)
    // },
    changeColor(id) {
      this.selectedColor = id
      var renderer = this.$refs.renderer.renderer
      var texture = THREE.ImageUtils.loadTexture(this.colors[this.selectedColor-1].path)
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set( 20, 20 );
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
      texture.magFilter = THREE.NearestFilter
      // eslint-disable-next-line no-unused-vars
      for (const [key, module] of Object.entries(this.modules)){
        module.material.map = texture
        module.material.needsUpdate = true
      }
    },
    onObjectDragStart(event) {
      event.object.material.color.set('#FFFFFF')
      var position = event.object.position
      event.object.position.x = Math.round(position.x)
      event.object.position.y = Math.round(position.y)
      var box = new THREE.Box3().setFromObject(event.object)
      var maxPoint = [box.max.x + 50, box.max.y + 50]
      var minPoint = [box.min.x + 50, box.min.y + 50]
      this.fillWord(0, maxPoint, minPoint)
      this.startPosition = JSON.parse(JSON.stringify(event.object.position))
      this.showModuleActions(event)
    },
    onObjectDrag(event) {
      var position = event.object.position
      // event.object.position.y = 0
      event.object.position.x = Math.round(position.x)
      event.object.position.y = Math.round(position.y)
      var box = new THREE.Box3().setFromObject(event.object)
      var maxPoint = [box.max.x + 50, box.max.y + 50]
      var minPoint = [box.min.x + 50, box.min.y + 50]
      if (!this.checkWord(maxPoint, minPoint)){
        event.object.material.color.set( 0xFF0000 )
      } else {
        event.object.material.color.set( 0xFFFFFF )
      }

      var scene = this.$refs.scene
      scene.remove(toRaw(this.attrControls.text_axis_y))
      scene.remove(toRaw(this.attrControls.text_axis_x))
      scene.remove(toRaw(this.attrControls.line))
      scene.remove(toRaw(this.attrControls.controls[0]))
      scene.remove(toRaw(this.attrControls.controls[1]))
      scene.remove(toRaw(this.attrControls.controls[2]))
      scene.remove(toRaw(this.attrControls.controls[3]))
      // this.attrControls.text_axis_x.remove()
      // this.attrControls.line.remove()
      this.attrControls.text_axis_y = null
      this.attrControls.text_axis_x = null
      this.attrControls.line = null
      this.attrControls.controls.length = 0
    },
    onObjectDragEnd(event) {
      var position = event.object.position
      event.object.position.x = Math.round(position.x)
      event.object.position.z = Math.round(position.z)
      event.object.position.y = Math.round(position.y)
      var box = new THREE.Box3().setFromObject(event.object)
      var maxPoint = [box.max.x + 50, box.max.y + 50]
      var minPoint = [box.min.x + 50, box.min.y + 50]
      // console.log(event.object.position)
      // console.log(maxPoint, minPoint)
      if (this.checkWord(maxPoint, minPoint, event)) {
        this.fillWord(1, maxPoint, minPoint)
        this.startPosition = null
        event.object.material.color.set('#FFFFFF')
      } else {
        event.object.position.x = this.startPosition.x
        event.object.position.z = this.startPosition.z
        event.object.position.y = this.startPosition.y
        this.startPosition = null
        event.object.material.color.set('#FFFFFF')
        box = new THREE.Box3().setFromObject(event.object)
        maxPoint = [box.max.x + 50, box.max.y + 50]
        minPoint = [box.min.x + 50, box.min.y + 50]
        this.fillWord(1, maxPoint, minPoint)
      }


    },
    fillWord(fill, maxPoint, minPoint, scale=false) {
      if (scale){
        maxPoint = [Math.round(maxPoint[0]) * 2, Math.round(maxPoint[1])* 2]
        minPoint = [Math.round(minPoint[0])* 2, Math.round(minPoint[1])* 2]
      } else {
        maxPoint = [Math.round(maxPoint[0]), Math.round(maxPoint[1])]
        minPoint = [Math.round(minPoint[0]), Math.round(minPoint[1])]
      }

      for (var i = minPoint[0]; i < maxPoint[0]; i++){
        for (var j = minPoint[1]; j < maxPoint[1]; j++){
          this.world[i][j] = fill
        }
      }
    },
    checkWord(maxPoint, minPoint) {
      maxPoint = [Math.round(maxPoint[0]), Math.round(maxPoint[1])]
      minPoint = [Math.round(minPoint[0]), Math.round(minPoint[1])]
      for (var i = minPoint[0]; i < maxPoint[0]; i++){
        for (var j = minPoint[1]; j < maxPoint[1]; j++){
          if (this.world[i][j] == 1) {
            return false
          }
        }
      }
      return true
    },
    onDragStart(event, item) {
      this.dragbleModuleId = item
    },
    onDrop() {
      this.addModel(this.module_types[this.dragbleModuleId-1].model_path)
      if (this.mode == 'view'){
        this.changeMode()
      }
    },
    changeMode() {
      if (this.mode == 'create') {
        this.mode = 'view'
        this.orbitCtrl.enableRotate = true
        this.enablePan = false
        this.dragCtrl.deactivate();
      } else {
        this.mode = 'create'
        this.orbitCtrl.enableRotate = false
        this.enablePan = true
        this.dragCtrl.activate();
        this.cameraTotop()
      }
    },
    cameraTotop() {
      // console.log(gsap)
      this.camera.position.set(0,0,60)
      this.orbitCtrl.enabled = false;
      this.orbitCtrl.reset();
      const vect3 = new THREE.Vector3(-1,0,0);
      this.orbitCtrl.target = vect3;
      this.camera.lookAt(vect3);
      this.orbitCtrl.enabled = true;
    },
    addModel(path) {
      var colors = this.colors
      var selectedColor = this.selectedColor-1
      const fbxLoader = new FBXLoader()
      var renderer = this.$refs.renderer.renderer
      fbxLoader.load(
        path,
        (object) => {
          object.traverse(function(child){
            if(child instanceof THREE.Mesh){
              var texture = new THREE.TextureLoader().load(colors[selectedColor].path);
              texture.wrapS = THREE.RepeatWrapping;
              texture.wrapT = THREE.RepeatWrapping;
              texture.repeat.set( 20, 20 );
              texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
              child.material.map = texture
              child.material.color.set( 0xFFFFFF )
              child.castShadow = true;
            }
          })
          object.traverse( function ( child ) {
              if ( child.isMesh ) {
                var middle = new THREE.Vector3();
                var geometry = child.geometry
                geometry.computeBoundingBox()
                middle.x = (geometry.boundingBox.max.x + geometry.boundingBox.min.x) / 2
                middle.y = (geometry.boundingBox.max.y + geometry.boundingBox.min.y) / 2
                middle.z = (geometry.boundingBox.max.z + geometry.boundingBox.min.z) / 2
                child.localToWorld( middle )
                return middle
              }
          });

          object.position.x = Math.round(object.position.x)
          object.position.z = Math.round(object.position.z)
          object.position.y = Math.round(object.position.y)
          // console.log(object)
          object.scale.set(2,2,2)
          var box = new THREE.Box3().setFromObject(object)
          var maxPoint = [(box.max.x + 50), (box.max.y + 50)]
          var minPoint = [(box.min.x + 50), (box.min.y + 50)]
          var x = 0

          while(!this.checkWord(maxPoint, minPoint)){
            box = new THREE.Box3().setFromObject(object)
            maxPoint = [maxPoint[0] + 2, maxPoint[1]]
            minPoint = [minPoint[0] + 2, minPoint[1]]
            object.position.set(x+2, 0, 0);
            x += 2
            if (x == 100) {
              break
            }
          }
          this.fillWord(1, maxPoint, minPoint, false)

          // console.log(object)
          var scene = this.$refs.scene
          object.isDraggable = true;
          object.castShadow = true;
          scene.add(object)

          box = new THREE.Box3().setFromObject(object.children[0])
          var size_x = Math.round(box.max.x - box.min.x)
          var size_y = Math.round(box.max.y - box.min.y)
          var sc_x = (size_x + 1) / size_x - 1
          var sc_y = (size_y + 1) / size_y - 1
          object.children[0].sc = {
            "x": sc_x,
            "y": sc_y,
          }
          object.children[0].position_delta = {
            "x": size_x * sc_x,
            "y": size_y * sc_y,
          }

          this.modules.push(object.children[0])
        },
        // (xhr) => {
        //     // console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
        // },
        (error) => {
            console.log(error)
        }
      )
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.red {
  background-color: red;
}
.constructor {
  height: 600px;
}
.price-footer{
  display: flex;  /* make the row a flex container */
  align-items: center;
}
.price-footer span:nth-child(2){
  font-size: 1.8rem;
  font-weight: 500;
}
.constructor-color-list-item.selected img{
  border: 3px solid orange;
  min-width: 50px;
}
.constructor-action-bar {
  background: #fff;
  border-radius: 6px;
  font-size: 2rem;
}
.bar-item{
  border-radius: 4px;
}
.bar-item:hover{
  background: #ccc;
}
.bar-item.active{
  background: #00CC66;
  color: #fff;
}
.constructor-module-list{
  background: #fff;
}
.constructor-module-list-item{
  font-size: 0.7vw;
  font-weight: 600;
}
.constructor-module-list-item img{
  cursor: grab;
  max-width: 100px;
}
.round-corner-m {
  border-radius: 25px;
}
.round-corner-sm {
  border-radius: 16px;
}
.constructor-menu {
  background: #fff;
  bottom: 0;
}
</style>
