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

        <v-text-field label="image" 
          v-model="image" 
          append-inner-icon="mdi-upload"
          @click:append-inner="showDialog"
        ></v-text-field>
        <dialog id="upload" persistent max-width="290">
          <v-card>
            <v-card-title>
              <span class="headline">Upload Image</span>
            </v-card-title>
            <v-card-text>
              <v-file-input
                id="file-upload"
                v-model="file"
                accept="image/*"
                show-size
                show-file-size
              ></v-file-input>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="blue darken-1" text @click="hideDialog">Close</v-btn>
              <v-btn color="blue darken-1" text @click="upload">Upload</v-btn>
            </v-card-actions>
          </v-card>
        </dialog>
        <img :src="image" style="max-width:100%" />
        <v-text-field label="tags" v-model="tag"></v-text-field>
        <v-text-field label="Weight" v-model="Weight" type="number"></v-text-field>
         
      </v-card-text>
      <v-card-actions>
        <v-btn color="#ed6803" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
    <LoginView />
  </div>
</template>
<script setup lang="ts">
// get id from the route
  import { useRoute } from 'vue-router'
  import firebase from "firebase/compat/app";
  //firestore
  import "firebase/compat/firestore";
  import "firebase/compat/storage";
  // Required for side-effects
  // import "firebase/firestore";
  import LoginView from './LoginView.vue'
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
      const that = this
      return {
        title: 'loading...',
        content: 'loading...',
        id: useRoute().params.id,
        save() {
          console.log('saving...')
          const currentUser = firebase.auth().currentUser
          console.log(currentUser.uid)

          firebase.firestore().collection('anywhere').doc(that.id).set({
            title: that.title,
            content: that.content,
            url: that.url,
            image: that.image,
            tag: that.tag,
            Weight: that.Weight,
            published: true, // 
          })
        },
        image: '',
        url: '',
        Weight: 0,
        published: true,
        tag: '',
        file: null,
      }
    },
    methods: {
      upload() {
        const file = document.getElementById('file-upload').files[0]
        const storageRef = firebase.storage().ref("pub")
        const fileRef = storageRef.child(file.name)
        fileRef.put(file).then(() => {
          console.log('Uploaded a file')
          fileRef.getDownloadURL().then(url => {
            console.log(url)
            // this.image = url
          })
        })
      },
      showDialog() {
        const dialog = document.getElementById('upload')
        dialog.showModal()
      },
      hideDialog() {
        const dialog = document.getElementById('upload')
        dialog.close()
      },
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
