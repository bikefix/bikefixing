<template>
  <div id="firebaseui-auth-container" v-if="show"> </div>
  <div v-else > 
    You are loggin in as {{user.displayName}}
    <btn @click="logout">Logout</btn>

  </div>
</template>
<script setup lang="ts">
// firebase login
import firebase from 'firebase/compat/app';
import * as firebaseui from 'firebaseui'
import 'firebaseui/dist/firebaseui.css'


</script>
<script lang="ts">


export default {
  name: 'login',
  data() {
    return {
      show: !firebase.auth().currentUser
    }
  },
  mounted() {
    if (firebase.auth().currentUser) {
      return this.show = false
    }
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        console.log('logged in', user)
        this.show = false
      }
    })
    this.init()
  },
  methods: {
    logout() {
      firebase.auth().signOut().then(() => {
        console.log('logged out')
        this.show = true
        this.init()
      })
    },
    init() {
      const ui = new firebaseui.auth.AuthUI(firebase.auth())
      let path = this.$route.path
  
      if (path === '/login') {
        path = '/'
      }
      ui.start('#firebaseui-auth-container', {
        signInOptions: [
          firebase.auth.EmailAuthProvider.PROVIDER_ID,
          firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          firebase.auth.PhoneAuthProvider.PROVIDER_ID,
        ],
        signInSuccessUrl: path,
        signInFlow: 'popup',
        tosUrl: '/',
        privacyPolicyUrl: '/'
      });
    }
  }
}
</script>
<style>
</style>
