<template>
  <div id="firebaseui-auth-container" v-if="!user">
    <h1>login</h1>
  </div>
</template>
<script setup lang="ts">
// firebase login
import firebase from 'firebase/compat/app';
import * as firebaseui from 'firebaseui'
import 'firebaseui/dist/firebaseui.css'


</script>
<script lang="ts">

const firebaseConfig = {
  apiKey: "AIzaSyCn21vUBcaJn5MxXYJb5NbyoMr8XV1gjP8",
  authDomain: "bikefix-248611.firebaseapp.com",
  databaseURL: "https://bikefix-248611.firebaseio.com",
  projectId: "bikefix-248611",
  storageBucket: "bikefix-248611.appspot.com",
  messagingSenderId: "472007851446",
  appId: "1:472007851446:web:e6cd7d1b36344b01079517"
};

firebase.initializeApp(firebaseConfig)

export default {
  mounted() {
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
  }
}

</script>
<style>
</style>
