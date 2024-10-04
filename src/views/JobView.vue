<template>
  <div id="firebaseui-auth-container">
    <h1>login</h1>
  </div>
</template>
<script setup lang="ts">
// firebase login
import firebase from 'firebase/compat/app';
import * as firebaseui from 'firebaseui'
import 'firebaseui/dist/firebaseui.css'
import { defineComponent, onMounted } from 'vue'

</script>
<script lang="ts">
export default defineComponent({
  name: 'login',
  setup() {
    onMounted(() => {
      const ui = new firebaseui.auth.AuthUI(firebase.auth());
      ui.start('#firebaseui-auth-container', {
        signInOptions: [
          firebase.auth.EmailAuthProvider.PROVIDER_ID,
          firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          firebase.auth.PhoneAuthProvider.PROVIDER_ID,
        ],
        signInSuccessUrl: '/',
        signInFlow: 'popup',
        tosUrl: '/',
        privacyPolicyUrl: '/'
      });
    })
  }
})

</script>
<style>
</style>
