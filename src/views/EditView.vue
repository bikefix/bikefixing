<template>
  <div class="about">
    <!-- the editing page form will go here -->
    <v-card>
      <v-card-title>
        <h2>Edit Page: {{title}} </h2>
      </v-card-title>
      <v-card-text>
        <v-text-field label="Title" v-model="title"></v-text-field>
        <v-textarea label="Content" v-model="content"></v-textarea>
        <component :is="{ ...asElement}" /><br />
        
        <v-text-field label="url" v-model="url"></v-text-field>

        <v-text-field label="image" v-model="image"></v-text-field>
        <v-text-field label="tags" v-model="tag"></v-text-field>
        <v-text-field label="Weight" v-model="Weight" type="number"></v-text-field>
        
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
    computed: {
      asElement() {
        return {
          template: "<div>" + this.content + "</div>"
        }
      }
    },
    data() {
      this.getData(data => {
        console.log(data[this.id])

        const { title, content, url, image, tag, Weight } = data[this.id]
        this.title = title
        this.content = content
        this.url = url
        this.image = image
        this.tag = tag
        this.Weight = Weight
      })
      return {
        title: 'loading...',
        content: 'loading...',
        id: useRoute().params.id,
        save() {
          console.log('saving...')
        },
        image: '',
        url: '',
        Weight: 0,
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
