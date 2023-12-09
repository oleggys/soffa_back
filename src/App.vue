<template>
  <div class="container-fluid">
    <Constructor/>
  </div>
</template>

<script>
import MyConstructor from './components/MyConstructor.vue'

export default {
  name: 'App',
  components: {
    Constructor: MyConstructor
  }
}
</script>

<style>
</style>
