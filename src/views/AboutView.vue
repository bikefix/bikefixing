<template>
  <div class="about">
    <h1>This is an edit page for id: {{id}}</h1>
    <!-- the editing page form will go here -->
    <v-card>
      <v-card-title>
        <h2>Edit Page</h2>
      </v-card-title>
      <v-card-text>
        <v-text-field label="Title" v-model="title"></v-text-field>
        <v-textarea label="Content" v-model="content"></v-textarea>
      </v-card-text>
      <v-card-actions>
        <v-btn color="#ed6803" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>
<script setup lang="ts">
// get id from the route
  import { useRoute } from 'vue-router'
</script>
<script lang="ts">

  export default {
    data() {
      this.getData(data => {
        const { title, content } = data[this.id]
        this.title = title
        this.content = content
      })
      return {
        title: 'loading...',
        content: 'loading...',
        id: useRoute().params.id,
        save() {
          console.log('saving...')
        }
      }
    }
  }


</script>
<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
