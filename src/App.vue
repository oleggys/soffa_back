<template>
  <div class="container-fluid">
    <MyConstructor/>
  </div>
</template>

<script>
import MyConstructor from './components/MyConstructor.vue'

export default {
  name: 'App',
  components: {
    MyConstructor: MyConstructor
  }
}
</script>

<style>
</style>
