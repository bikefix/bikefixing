import './assets/main.css'

import { createApp } from "vue/dist/vue.esm-bundler"

import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import SimpleIDB from "./simpleIDB"
import store from "./store"


const app = createApp(App)

const vuetify = createVuetify({
  components,
  directives,
})

let dataGot = {
    p:false,
    d:false,
}


import InstantSearch from 'vue-instantsearch/vue3/es'
import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter'
import {getSig} from 'crypo.js'

function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}
function getSearchAdapter(apiKey, nodes) {
  return new TypesenseInstantSearchAdapter({
    server: {
      apiKey,
      nodes,
    },
    // The following parameters are directly passed to Typesense's search API endpoint.
    //  So you can pass any parameters supported by the search endpoint below.
    //  queryBy is required.
    //  filterBy is managed and overridden by InstantSearch.js. To set it, you want to use one of the filter widgets like refinementList or use the `configure` widget.
    additionalSearchParameters: {
      query_by: 'name, phone, email, theBikeMake, theBikeModel, theServices',
    },
  })
}
export const deepEqual = function(object1:any, object2:any) {
  if (!object1 && object2) return false
  if (!object1 && !object2) return false // true
  if (object1 && !object2) return false
  const keys1 = Object.keys(object1)
  const keys2 = Object.keys(object2)
  if (keys1.length !== keys2.length) {
    return false
  }
  for (const key of keys1) {
    const val1 = object1[key]
    const val2 = object2[key]
    const areObjects = (typeof val1 === "object") && (typeof val2 === "object")
    if (areObjects && !deepEqual(val1, val2) || !areObjects && val1 !== val2) {
      return false
    }
  }
  return true
}


function noVowels(string){
  const characterArray = string.split("")
  return characterArray.map(character => {
    if(/[aeiouy]/.test(character)){
      character = ""
    } else {return character}
  }).join("")
}

function asyncUser(field:string = "uid") {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      return reject("This browser doesn't support IndexedDB")
    }
    try {
      const request = indexedDB.open("firebaseLocalStorageDb");
      request.onerror = (e) => {
        return reject(e)
      }
      request.onsuccess = () => {
        const db = request.result
        try {
          console.log("getting user")
          SimpleIDB.get("user", (user) => {
            if (user && user[field]) {
              return resolve(user)
            }
            try {
              if (!db.objectStoreNames.contains("firebaseLocalStorage")) return reject("No user found")
              const transaction = db.transaction(["firebaseLocalStorage"], "readonly");
              const store = transaction.objectStore("firebaseLocalStorage")
              const r = store.getAll()
              r.onsuccess = () => {
                let userT = {uid:"",user_id:""}
                r.result.forEach((v) => {
                  if (v.value?.uid) {
                    userT = parseJwt(v.value?.stsTokenManager?.accessToken)
                  }
                })
                if (userT.uid || userT.user_id) {
                  const newUser = {uid:userT.user_id, ...userT, ...user}
                  if (!app.config.globalProperties.user) {
                    app.config.globalProperties.user = newUser;
                  }
                  if (newUser[field]) {
                    return resolve(newUser)
                  } else {
                    return reject("user dus not have " + field)
                  }
                }
              }
              r.onerror = (e) => {
                return reject(e)
              }
            } catch (e) {
              return reject(e)
            }
          })
        } catch (e) {
          return reject(e)
        }
      }
    } catch (e) {
      return reject(e)
    }
  })
}


app.config.globalProperties.asyncUser = asyncUser
app.config.globalProperties.SimpleIDB = SimpleIDB
app.config.globalProperties.noVowels = noVowels
app.config.globalProperties.money = function (c:any) {
  if (typeof c === "string") {
    c = c.replace("£", "")
  }
  return (+(c || 0)).toLocaleString("en-UK", {
      style: "currency",
      currency: "GBP",
  })
}
app.config.globalProperties.price = function (services = []){
  if (services.length) {
    return this.money(services.reduce((a ,b) => {
      return +a + (+b.price * +b.num)
    },0))
  } else {
    return this.money(0)
  }
}
app.config.globalProperties.asTime = function (val, moment) {
  console.log(val, moment)
  const date = moment(val, "HH:mm")
  return date.format('h:mm a')
}
app.config.globalProperties.getParts = function (cb:Function) {
    const requestURL = "https://bikefix-248611.firebaseio.com/parts.json"
    let request = new XMLHttpRequest()
    request.open("GET", requestURL)
    request.responseType = "json"
    request.onload = function () {
        if (request.response) {
            dataGot.p = true;
            app.config.globalProperties.SimpleIDB.set("p", request.response)
            store.commit("parts", request.response)
            if (cb) cb(request.response)
        }
    };
    if (window.navigator.onLine && !dataGot.p) {
        try {
            request.send()
        } catch (e) {
            console.error(e)
        }
    }
    return app.config.globalProperties.SimpleIDB.get("p").then((p) => {
        if (p) {
            store.commit("parts", p)
            if (cb) cb(p)
            return p
        }
    })
}
app.config.globalProperties.getStatus = function (job) {
    let legacyJob = { ...job, ...(job.status || {}) }
    return statuses.reduce((a, v) => {
        if (legacyJob[v] && (!legacyJob[a] || legacyJob[a] <= legacyJob[v])) {
            return v
        }
        return a
    }, "Booked")
}
app.config.globalProperties.getStatusHash = function (job) {
    return job[app.config.globalProperties.getStatus(job)] || "11111";
}
app.config.globalProperties.deepEqual = deepEqual
app.config.globalProperties.isObject = function (object) {
    return object != null && typeof object === "object";
}
app.config.globalProperties.sortObj = function (obj) {
    return Object.keys(obj)
        .sort()
        .reduce((a, b) => {
            a[b] =
                typeof obj[b] === "object"
                    ? app.config.globalProperties.sortObj(obj[b])
                    : obj[b];
            return a;
        }, {});
}
app.config.globalProperties.saveUser = function (user, fs) {
    let uid = user.uid;
    delete user.token;
    delete user.uid;
    delete user.metadata;
    Object.keys(user).forEach((key) => {
        if (user[key] === "") {
            user[key] = null;
        } else if (!user[key]) {
            delete user[key];
        }
    });
    try {
        let that = this;
        getSig(user, (sig) => {
          console.log("save user", user);
            let pubKey = localStorage.getItem("pubKey");
            let keys = user.keys || {};
            keys[pubKey] = that.hashNow();
            fs.collection("users")
                .doc(uid)
                .update({ ...user, sig, keys });
        });
    } catch (e) {
        console.error(e);
    }
}
app.config.globalProperties.getData = function (cb: Function = ()=>{}) {
    const requestURL = "https://bikefix-248611.firebaseio.com/pages.json";
    let request = new XMLHttpRequest();
    request.open("GET", requestURL);
    request.responseType = "json";
    request.onload = function () {
      if (request.response) {
          dataGot.d = true;
          app.config.globalProperties.SimpleIDB.set("d", request.response);
          store.commit("pages", request.response);
          if (cb) cb(request.response);
      }
    };
    if (window.navigator.onLine && !dataGot.d) {
      try {
          request.send();
      } catch (e) {
          console.error(e);
      }
    }
    return app.config.globalProperties.SimpleIDB.get("d").then((d) => {
      if (d) {
          if (cb) cb(d);
          if (d.pages) {
              store.commit("pages", d.pages);
          } else {
              store.commit("pages", d);
          }
      }
      return d;
    });
}
app.config.globalProperties.debounce = function (func, wait = 500, immediate) {
  var timeout;
  console.log("debouncing 1");
  return () => {
      let context = this;
      let args = arguments;
      clearTimeout(timeout);
      console.log("debouncing 2");
      timeout = setTimeout(function () {
          timeout = null;
          console.log("debouncing 3");
          if (!immediate) func.apply(context, args);
      }, wait);
      if (immediate && !timeout) func.apply(context, args);
  };
}
app.config.globalProperties.to = function (go) {
  let to = {
      path: "",
      query: {},
  }
  const from = this.$route;
  if (typeof go === "string") {
      to = { ...from, path: go };
  } else {
      const query = { ...from.query, ...go.query };
      to = { ...from, ...go, query };
  }
  return (
      to.path +
      Object.keys(to.query).reduce((a, v) => {
          if (v == "search" || !to.query[v]) return a;
          return (a ? a + "&" : "?") + v + "=" + to.query[v];
      }, "")
  );
}
app.config.globalProperties.fg = function (bg) {
  let c = bg.substring(1); // strip #
  let rgb = parseInt(c, 16); // convert rrggbb to decimal
  let r = (rgb >> 16) & 0xff; // extract red
  let g = (rgb >> 8) & 0xff; // extract green
  let b = (rgb >> 0) & 0xff; // extract blue
  let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
  if (luma > 128) {
      return "#000";
  } else {
      return "#FFF";
  }
};
/* eslint-disable no-new */
app.config.globalProperties.hashNow = function (n = 0) {
  return Math.floor(new Date().getTime() / (15 * 60 * 1000) + n).toString(36); // new one ever 15 mins.
}
app.config.globalProperties.dateFormHash = function (timeHash) {
  return timeHash
      ? new Date(parseInt(timeHash, 36) * (15 * 60 * 1000))
      : false;
}
app.config.globalProperties.lastMsg = (job) => {
  if (job.chat) {
      const chat = Object.keys(job.chat)
          .map((k) => {
              return {
                  n: k.split("-")[0],
                  uid: k.split("-")[1],
                  ...job.chat[k],
              };
          })
          .sort((a, b) => {
              return +b.n - +a.n;
          })[0];
      if (!chat) return "";
      if (chat && chat.txt) {
          return chat.txt;
      } else if (chat.type) {
          return "a image from " + chat.uid; // TODO get name
      } else {
          return "a file from " + chat.uid;
      }
  } else {
      return "";
  }
}
app.config.globalProperties.getSearchAdapter = getSearchAdapter 
app.config.globalProperties.getSig = getSig

// app.mount("#app")
const timer = setTimeout(() => {
  app.config.globalProperties.user = false;
  app.mount("#app");
}, 1000);
asyncUser("ts_nodes").then((user) => {
  if ("ts_key" in user) {
    console.log("search client loading");
    app.config.globalProperties.jobSearch = getSearchAdapter(user.ts_key, user.ts_nodes)
    console.log("search client loaded");
  }
  console.log("user", user);
  app.config.globalProperties.user = user;
}).catch((e) => {
  console.error(e);
}).finally(()=>{
  clearTimeout(timer);
  app.mount("#app");
})

app.use(InstantSearch)
app.use(store)
app.use(router)
app.use(vuetify)
