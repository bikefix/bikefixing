function init(){
    console.log("init", typeof indexedDB)
    if (typeof indexedDB !== "undefined") return new Promise((resolve, reject) => {
        let request = indexedDB.open('bfDatabase')
        request.onupgradeneeded = function() {
            request.result.createObjectStore('bfStore')
            resolve(true)
        }
        request.onerror = function() {
            reject(request.error)
        }
    })
}

type UpperCaseCharacter = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'|'L'|'M'|'N'|'O'|'P'|'Q'|'R'|'S'|'T'|'U'|'V'|'W'|'X'|'Y'|'Z'
type Character = UpperCaseCharacter | Lowercase<UpperCaseCharacter>
init()

export default {
  getItem(key:string, cb:Function){
    return this.get(key, cb)
  },
  getAll(letter:Character, cb:Function) {
    const range = IDBKeyRange.bound(letter, String.fromCharCode(letter.charCodeAt(0) + 1))
    return new Promise((resolve, reject) => {
      let oRequest = indexedDB.open('bfDatabase')
      oRequest.onsuccess = () => {
        const db = oRequest.result
        const tx = db.transaction('bfStore', 'readonly')
        const st = tx.objectStore('bfStore')
        try {
          let aRequest = st.getAll(range)
          aRequest.onsuccess = function(){
            if (cb) {
              cb(aRequest.result)
            }
            resolve(aRequest.result)
          }
          aRequest.onerror = function() {
            reject(aRequest.error)
          }
        } catch (e) {
          reject(e)
        }
      }
      oRequest.onerror = function() {
        reject(oRequest.error)
      }
    })
  },
  get(key:string, cb:Function) {
    return new Promise((resolve, reject) => {
      let oRequest = indexedDB.open('bfDatabase')
      oRequest.onsuccess = () => {
        const db = oRequest.result
        const tx = db.transaction('bfStore', 'readonly')
        let st = tx.objectStore('bfStore')
        try {
          let kRequest = st.getAllKeys()
          kRequest.onsuccess = function(){
            if (kRequest.result.find(k => k == key)) {
              let gRequest = st.get(key)
              gRequest.onsuccess = function() {
                if (cb) {
                  cb(gRequest.result)
                }
                resolve(gRequest.result)
              }
              gRequest.onerror = function() {
                reject(gRequest.error)
              }
            } else {
              if (cb) {
                resolve(cb())
              } else {
                resolve(true)
              }
            }
          }
          kRequest.onerror = function() {
            reject(kRequest.error)
          }
        } catch (e) {
          reject(e)
        }
      }
      oRequest.onerror = function() {
        reject(oRequest.error)
      }
    })
  },
  set(key:string, value:any) {
    return new Promise((resolve, reject) => {
      let oRequest = indexedDB.open('bfDatabase')
      oRequest.onsuccess = () => {
        const db = oRequest.result
        const tx = db.transaction('bfStore', 'readwrite')
        const st = tx.objectStore('bfStore')
        const sRequest = st.put(value, key)
        sRequest.onsuccess = function() {
          resolve(true)
        }
        sRequest.onerror = function() {
          reject(sRequest.error)
        }
      }
      oRequest.onerror = function() {
        reject(oRequest.error)
      }
    })
  },
  remove(key:string) {
    return new Promise((resolve, reject) => {
      let oRequest = indexedDB.open('bfDatabase')
      oRequest.onsuccess = () => {
        const db = oRequest.result
        const tx = db.transaction('bfStore', 'readwrite') //, {durability: "relaxed"})
        let st = tx.objectStore('bfStore')
        let rRequest = st.delete(key)
        rRequest.onsuccess = function() {
          resolve(true)
        }
        rRequest.onerror = function() {
          reject(rRequest.error)
        }
      }
      oRequest.onerror = function() {
        reject(oRequest.error)
      }
    })
  },
  clear() {
    return new Promise((resolve, reject) => {
      let delRequest = indexedDB.deleteDatabase("bfDatabase")
      delRequest.onsuccess = function() {
        resolve(true)
      }
      delRequest.onerror = function() {
        reject(delRequest.error)
      }
    })
  },
  setItem(key:string, value:any) {
    return this.set(key, value)
  },
  x(key:string, value:any) {
    return this.et(key, value)
  },
  et(key:string, value:any) {
    if (value === undefined) {
      return this.get(key, () => null)
    } else if(typeof value == "function" ) {
      return this.get(key, value)
    } else if(value === null) {
      return this.remove(key)
    } else {
      return this.set(key, value)
    }
  },
  removeItem(key:string){
    return this.remove(key)
  },
}
