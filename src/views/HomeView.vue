<script setup lang="ts">
//  import TheWelcome from '../components/TheWelcome.vue'
</script>

<template>
  <v-container fluid dark>
    <router-view />
    <v-row class="px-6">
      <v-col class="d-flex flex-column" sx="12" sm="12" md="6" v-for="(page, i) in pages" :key="i+`_page`">
        <v-card variant="text" class="flex d-flex flex-column"><a :name="page.title"></a>
          <v-img v-if="page.image" style="max-height:300px" :src="mdImg(page.image)" :lazy-src="smImg(page.image)" />
          <v-card-title>{{page.title}}</v-card-title>
          <v-card-text> <component :is="{ ...page.asElement}" /> </v-card-text>
          <v-card-actions>
            <v-btn :href="`/edit/${page.id}`" color="#ed6803" class="mx-auto">
              edit
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-layout column style="position: fixed;right: 0px;margin-right: 68px;bottom:0;margin-bottom:110px">
      <v-btn href="https://bikebook.co.uk/mechanic/bikefix/book" color="#ed6803" absolute bottom right style="color:white;position:fixed;bottom:110px;right:68px">
          book in
      </v-btn>
    </v-layout>
  </v-container>
</template>
<script lang="ts">
/*
import { defineAsyncComponent } from 'vue'

const AsyncComp = defineAsyncComponent(() => {
  return new Promise((resolve) => {
    // ...load component from server
    resolve(/* loaded component * /)
  })
})
*/
export default {
    data() {
        return {
            pages:[],
        }
    },
    mounted(){
        this.getData(data => {
            this.setPages(data)
        })
    },
    methods:{
        setPages(pages){
            console.log(pages)
            const {path} = this.$route.matched[0]
            const urls = Object.keys(pages).map(p => pages[p].url)
            this.pages = Object.keys(pages).filter(k => {
                return pages[k].url === path || pages[k].url === "/" + path || (pages[k].url === "/home" && path === "/")
            }).map(k => {
               return { ...pages[k], id: k}
            }).sort((a, b) => {
                return +a.Weight - +b.Weight
            }).map(p => {
                const html = p.content.split("<a href=\"/").map((h: string, i: number) => {
                    if (!i) return h // not the first part
                    const link = `/` + h.substring(0,h.indexOf(`"`))
                    if (urls.indexOf(link) === -1) {
                        console.log("Missing link", link)
                    }
                    return h.replace("</a>","</router-link>").replace(`target="_blank"`, '')
                }).join("<router-link to=\"/")
                const asElement = {
                    template: "<div>" + html + "</div>"
                }
                return { ...p, asElement}
            })
            console.log(this.pages)
        },
        smImg(url){
            url = url.replace("https://storage.googleapis.com/bikefix-248611.appspot.com/","")
            console.log("20X20",url)
            return "https://firebasestorage.googleapis.com/v0/b/bikefix-248611.appspot.com/o/" + url.split("/").join("%2F").replace(/(?:[.])([^.]*)$/, "_20x20.$1?alt=media")
        },
        mdImg(url){
            return url.replace(/(?:[.])([^.]*)$/, "_400x400.$1?alt=media")
        },
    },
}
</script>
<style>
  .v-application .v-card__text td:last-child,
  .v-application .v-card__text th:last-child {
    text-align: right;
  }
  .v-application .v-card__text a {
    border: #ed6803 solid 1px;
    color: #ed6803;
    font-weight: 700;
    padding: 1px 3px;
    text-decoration: none;
    white-space: nowrap;
  }
</style>

