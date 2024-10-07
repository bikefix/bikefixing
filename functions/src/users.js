// keys
const pubKey = '{"crv":"P-256","ext":true,"key_ops":["verify"],"kty":"EC","x":"TzxFgP_baIMITsHrAlA-17OMdd7sxLAy_zYDnm1O3dk","y":"FubDcwElQOfrB6D-SA3Wqk_782T1kdm_e7GpG8UnkSg"}'
const prvKey = '{"crv":"P-256","d":"26mkcLn1ZL90VqR7oTOJVUYDvrL26RI7Fg-zbxi3Cps","ext":true,"key_ops":["sign"],"kty":"EC","x":"TzxFgP_baIMITsHrAlA-17OMdd7sxLAy_zYDnm1O3dk","y":"FubDcwElQOfrB6D-SA3Wqk_782T1kdm_e7GpG8UnkSg"}'
const { titleCase } = require("title-case")
const functions = require('firebase-functions/v1')
const admin = require('firebase-admin')
const fs = admin.firestore()
//const fetch = require('node-fetch')
const {sign, verify} = require('crypo.js')
const nodemailer = require('nodemailer')
const moment = require('moment')
const color = require('./color.js')
const { createSSRApp } = require('vue')
const { renderToString } = require('@vue/server-renderer')
const JSURL = require('jsurl')

// const key = 'AAAAbeXcPbY:APA91bHK7xWAi1fG8hX4jEy-gY3sqZ_bk1Dt5KPm21AD3WnX7vaeMp7X5-szzryN27LGtudZSElsAliDaebCwUIjeVD-UKpj_ZNy70djErPv97aKH1xvlotdN4bbLme4XyMPBXhyr680'
String.prototype.toTitleCase = function() {
  return titleCase(this)
}
let statuses = ["Booked", "ToDo", "Ready", "AwaitingCustomer", "AwaitingParts", "Collected", "filed"]
// returns one status or "" (falsey)
function getStatus(job) {
  let legacyJob = {...job, ...(job.status || {})}
  return statuses.reduce((a, v) => {
    if (legacyJob[v] && (!legacyJob[a] || legacyJob[a] <= legacyJob[v])) {
      return v
    }
    return a
  }, "")
}
function fg(bg) {
  if (typeof bg != "string") return "#000"
  let c = bg.substring(1);     // strip #
  let rgb = parseInt(c, 16);   // convert rrggbb to decimal
  let r = (rgb >> 16) & 0xff;  // extract red
  let g = (rgb >>  8) & 0xff;  // extract green
  let b = (rgb >>  0) & 0xff;  // extract blue
  let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
  if (luma > 128) {
    return "#000"
  } else {
    return "#FFF"
  }
}
async function sendMail(to, html, theBike, id) { 

  const mailOptions = {
    from: 'bikefix app <donotreply@bikefix.co.uk>',
    to,
    subject: `Update to ${theBike} service`.toTitleCase(),
    html,
  }
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'donotreply@bikefix.co.uk',
      pass: 'RfUDpGUsXU9PQd1AbsWNy0bEpq440tC0H9Cz8ENJjEqpHkEmUm70IJneubbcpCu'
    }
  })
  return transporter.sendMail(mailOptions, (erro, info) => {
    if (erro) {
      // eslint-disable-next-line no-console
      console.log("erro", JSON.stringify(erro), id)
      return erro.toString()
    }
    // eslint-disable-next-line no-console
    console.log("info", JSON.stringify(info), id)
    return info
  })
}
const hashNow = function(){
  return Math.round(new Date().getTime() / (15*60*1000)).toString(36) // new one ever 15 mins.
}
//const dateFormHash = function(timeHash){
//  return new Date(parseInt(timeHash, 36) * (15*60*1000))
//}
function noVowels(string){
  const characterArray = string.split("")
  return characterArray.map(character => {
    if(/[aeiouy]/.test(character)){
      character = ""
    } else {return character}
  }).join("")
}
function price(services = []){
  if (services.length) {
    return this.money(services.reduce((a ,b) => {
      return +a + (+b.price * +b.num)
    }, 0))
  } else {
    return this.money(0)
  }
}
function lastMsgFrom(data) {
  if (data.chat) {
    const chat = Object.keys(data.chat).map(k => {
      return {n: k.split("-")[0] , uid: k.split("-")[1], ...data.chat[k]}
    }).sort((a, b) => {
      return (+b.n - +a.n)
    })[0] || {}
    return chat.uid
  } else {
    return "" // no chat
  }
}
function lastMsg(data, sender = "") {
  let done =  "service"
  if (data && data.services && data.services[1]) {
    done = "services"
  }
  
  if (data.chat) {
    const chat = Object.keys(data.chat).map(k => {
      return {n: k.split("-")[0] , uid: k.split("-")[1], ...data.chat[k]}
    }).sort((a, b) => {
      return (+b.n - +a.n)
    })[0]
    if (chat && sender !== chat.uid) {
      if (chat.txt) {
        return chat.txt
      } else if (chat.image) {
        return "a new image was added to your " + done
      } else if (chat.url) {
        return "a new file was added to your " + done
      } else {
        return ""
      }
    } else {
      return "" // sender
    }
  } else {
    return "" // no chat
  }
}
function bikeId(job){
  const Bike = job.theBike 
  if (Bike && Bike.color) {
    let output = (Bike.make || "")+" "+(Bike.model || "")+" "+color(Bike.color.hex)
    if (output.length > 12) {
      output = (Bike.make || "")+" "+noVowels(Bike.model || "")+" "+color(Bike.color.hex)
    }
    if (output.length > 12) {
      output = noVowels((Bike.make || "")+" "+(Bike.model || ""))+" "+color(Bike.color.hex)
    }
    if (output.length > 12) {
      output = noVowels((Bike.make || "")+" "+(Bike.model || "")+" "+color(Bike.color.hex))
    }
    let u = {}
    return output.split(/[ -.,]+/).reduce((a,b) => {
      if (!u[b] && b.length > 1) {
        u[b] = 1
        a.push(b)
      }
      return a
    }, []).join("-")
  }
}
function addToPrintCue(job){
  let label = bikeId(job) || false
  if (label) {
    let toPrint = {
      ...job,
      label,
    }
    fs.collection("htmlToPrint").add(toPrint)
  }
}
function sendMsgMail(data) {
  const body = lastMsg(data, data.uid)
  if (!body) {
    return ""
  }
  let fromUid = lastMsgFrom(data)
  if (fromUid !== data.uid) {
    return fs.doc(`users/${data.uid}`).get().then(async ref => {
      const fromUser = ref.data()
      const name = fromUser.displayName
      let theBike
      let html = ""
      let bike = {}
      let htmlBike = ""
      if (data.forCustomer) {
        theBike = `${data.theBike.make} ${data.theBike.model}`
        bike = {color:{}, ...data.theBike}
      } else {
        let bikeRef = await fs.doc(`users/${data.uid}/bikes/${data.bike}`).get()
        bike = {color:{}, color2:{}, ...bikeRef.data()}
      }
      theBike = `${bike.make} ${bike.model}`
      if (bike.color.hex) {
        htmlBike = `"&nbsp;<span style="background-color:${bike.color.hex};color:${fg(bike.color.hex)}">&nbsp; ${bike.make} ${bike.model} &nbsp;</span>&nbsp;`
      } else {
        htmlBike = theBike
      }
      const dueDate  = moment(data.DueDate, "YYYY-MM-DD") 
      const dueDay   = dueDate.format("dddd")
      const dueTime  = data.Due || "5pm"

      if (data.forCustomer) {
        const templateRef = await fs.doc(`/bikeshop/bfx/emails/newMsgUnclaimed`).get()
        const template = templateRef.data().body
        const count = 1 + (templateRef.data().count || 0)
        const theData = {
          name, data, theBike, htmlBike, body, dueDay, dueTime,
          date: moment(data.date).format("dddd, Do MMMM"),
          linkJobSend: `https://bikefix.co.uk/j/${data.id}#${JSURL.stringify(data)}`,
        }
        fs.doc(`/bikeshop/bfx/emails/newMsgUnclaimed`).update({
          egData: JSON.stringify(theData, null, 2),
          last: hashNow(),
          count,
        }).catch(e => {
          // eslint-disable-next-line no-console
          console.log("JSON", e)
        })
        const theMsg = createSSRApp({
          data() {
            return theData
          },
          template,
        })
        html =  await renderToString(theMsg)
        return sendMail(data.forCustomer.email, html, theBike, data.id )
      } else {
        const templateRef = await fs.doc(`/bikeshop/bfx/emails/newMsg`).get()
        const template = templateRef.data().body
        const count = 1 + (templateRef.data().count || 0)
        const theData = {
          name, data, theBike, htmlBike, body, 
          date: moment(data.date).format("dddd, Do MMMM"),
          linkJobSend: `https://bikefix.co.uk/j/${data.id}#${JSURL.stringify(data)}`,
        }
        fs.doc(`/bikeshop/bfx/emails/newMsg`).update({
          egData: JSON.stringify(theData, null, 2),
          last: hashNow(),
          count,
        }).catch(e => {
          // eslint-disable-next-line no-console
          console.log("JSON", e)
        })
    
        const theMsg = createSSRApp({
          data() {
            return theData
          },
          template,
        })
        html = await renderToString(theMsg)
        return sendMail(data.email || fromUser.email || fromUser._email, html, theBike, data.id)
      }
    })
  } 
}
async function claim(uid, jid, jobDoc, ref) {
  // if (jid == jobDoc.id) return 1 // not claiming
  // eslint-disable-next-line no-console
  console.log(" 1 claiming from " + jid + " to " + jobDoc.id )
  const qs = await fs.collectionGroup('jobs').where('id', '==', jobDoc.from).get()
  // eslint-disable-next-line no-console
  if (qs.docs.length !== 1) {
    // eslint-disable-next-line no-console
    return console.log(qs.docs.length + " matchs")
  }
  const doc  = qs.docs[0] // ref copy from
  const job  = doc.data() // job to copy from
  const path = job.path // path to copy from
  if (!job.forCustomer || job.to) { // forCustomer means to was add by a shop got
    // eslint-disable-next-line no-console
    return  console.log("not a claim")
  }
  try {
    await doc.ref.set({to: `users/${uid}/jobs/${jid}`, sig: ""}, {merge: true})
    await fs.doc(`users/${uid}`).set({...job.forCustomer}, {merge: true})
  } catch(e) {
    // eslint-disable-next-line no-console
    console.log(e)
  }
  // eslint-disable-next-line no-console
  console.log(" 2 claiming users/" + uid + "/jobs/" + jid, JSON.stringify(jobDoc))
  
  if (job.theBike && !jobDoc.bike) {
    const bikeDoc = await fs.collection(`users/${uid}/bikes`).add(job.theBike)
    // eslint-disable-next-line no-console
    console.log("adding bike " + bikeDoc)
    if (bikeDoc._path && bikeDoc._path.segments) {
      jobDoc.bike = bikeDoc._path.segments[3]
    }
  }
  const chat = {...job.chat, ...jobDoc.chat}
  const {services = [], DueDate = " ", Due = " "} = job
  // eslint-disable-next-line no-console
  console.log(" 3 claiming "+ jid)
  return await ref.set({...jobDoc, chat, services, DueDate, Due, cliamed: true, path}, {merge: true})
}
function sendMsg(token, data, toUid) {
  // eslint-disable-next-line no-console
  console.log("sendMsg 1")
  const body = lastMsg(data, toUid)
  let fromUid = lastMsgFrom(data)
  if (body) {
    // eslint-disable-next-line no-console
    console.log("sendMsg 2")
    return fs.doc(`users/${fromUid}`).get().then(ref => {
      // eslint-disable-next-line no-console
      console.log("sendMsg 3")
      const fromUser = ref.data()
      const message = {
        data: {
          id: data.id,
          jid: data.id,
          fromUserName: fromUser.displayName, 
          fromUid,
          body,
        },
        token,
      }
      
      return admin.messaging().send(message).catch(error => {
        // eslint-disable-next-line no-console
        console.log('msg e005 Error sending message:', error);
      })
    }).catch(error => {
      // eslint-disable-next-line no-console
      console.error("msg e006", error)
    })
  } 
}
// Update Custom Claims from user permissions
exports.updatePermissions = functions.region('europe-west2').firestore.document('users/{userId}').onWrite((change, context) => {
  let {userId} = context.params
  let {permissions = null} = change.after.data()

  if (change.before.exists) {
    let {permissions: oldPermissions = null} = change.before.data()
    if (JSON.stringify(permissions) === JSON.stringify(oldPermissions)) {return null}
  }
  if (permissions.sig) {
    let sig = permissions.sig
    delete(permissions.sig)

    return verify(permissions, sig, pubKey, isValid => {
      if (isValid) {
        return admin.auth().setCustomUserClaims(userId, {permissions}).then(() => {
          return fs.doc(`users/${userId}`).update({updated: hashNow()})
        })
      } else {
        return fs.collection('users').get().then(users => {
          return users.forEach(user => {
            const keys = user.data().keys || []
            const userPermissions = user.data().permissions || {}
            return keys.forEach(pub => {
              verify(permissions, sig, pub, isValidByUser => {
                if (isValidByUser && Object.keys(permissions).reduce( prop => {
                  // Need to thoroughly check each prop to make sure it okay to pass on
                  return (JSON.stringify(userPermissions[prop]) === JSON.stringify(permissions[prop]))
                }, false)) {
                  return admin.auth().setCustomUserClaims(userId, {permissions}).then(() => {
                    return fs.doc(`users/${userId}`).update({updated: hashNow()})
                  })
                }
              })
            })
          })
        })
      }
    })
  } else {
    return null
  }
})

function bikeReady(token, data) {
  var message = {
    data:{
      title: 'bikefix',
      ready: '1',
      icon: 'https://bikefix.co.uk/logo.png',
      id: data.id,
      jid: data.id,
    },
    webpush: {
      headers: {
        Urgency: "high"
      }
    },
    token,
  }

  admin.messaging().send(message).catch((error) => {
    // eslint-disable-next-line no-console
    console.log('ready e005 Error  sending message:', message, error);
  })
}
// copy signed jobs to users/{uid}/jobs/{jid}/versions/{vid}
exports.emailUpdate = functions.region('europe-west2').firestore.document('/bikeshop/{shop}/emails/{id}').onWrite(async (change, context) => {
  // eslint-disable-next-line no-console
  console.log("add Versions email", context.params)
  const {shop, id} = context.params
  const before = {body:"", ...change.before.data(), id, shop}
  const after  = {body:"", ...change.after.data(), id, shop}
  if (before.body === after.body) return null
  return fs.collection(`/bikeshop/${shop}/emails/${id}`).get().then(async snap => {
    let size = snap.size
    return fs.doc(`/bikeshop/${shop}/emails/${id}/versions/${size}`).set(before)
  })
})
function addVersions(uid, jid, before){
  return fs.collection(`users/${uid}/jobs/${jid}/versions`).get().then(snap => {
    let size = snap.size
    return fs.doc(`users/${uid}/jobs/${jid}/versions/${size}`).set(before)
  })
}
function sendNotifications(uid, jid, before, after){
  // eslint-disable-next-line no-console
  console.log("sendNotifications")
  const notifications = before.notifications || {}
  if (notifications.Ready && Object.keys(notifications.Ready).length) {
    if (notifications.Ready && !getStatus(before) == "Ready" && getStatus(after) == "Ready") {
      Object.keys(notifications.Ready).forEach(to => {
        // eslint-disable-next-line no-console
        bikeReady(to, after)
      })
    }
  }
  if(notifications.msg && lastMsg(before) !== lastMsg(after)) {
    // eslint-disable-next-line no-console
    Object.keys(notifications.msg).forEach(to => {
      const toUid = notifications.msg[to]
      // eslint-disable-next-line no-console
      sendMsg(to, after, toUid)
    })
  }
}
async function sendEmails(uid, jid, before, after){
  if (getStatus(before) != getStatus(after)) {
    const moveFrom = (getStatus(before) || "new")
    const moveTo = (getStatus(after) || "del")
    const move = moveFrom + " => " + moveTo + (after.forCustomer ? " unclaimed" : "")
    if (move.indexOf("new => ToDo") !== -1) {
      addToPrintCue(after)
    }
    if (move.indexOf("Ready => Collected") !== -1) {
      fs.doc(after.path).set({...after, paid:price(after.services)})
    }
    const moveRef = fs.doc(`/bikeshop/bfx/emails/${move}`)
    const moveDataRef = await moveRef.get()
    let bike = {}
    let customer = {}
    let theBike = ""
    let htmlBike = ""
    let mail = ""
    if (after.forCustomer) {
      let bikeData = {color:{}, ...after.theBike}
      theBike = `${bikeData.make} ${bikeData.model}`
      bike = {color:{}, ...after.theBike}
      mail = after.forCustomer.email
      customer = { ...after.forCustomer}
    } else if (after.bike) {
      let bikeRef = await fs.doc(`users/${after.uid}/bikes/${after.bike}`).get()
      bike = {color: {}, ...bikeRef.data()}
      let userRef = await fs.doc(`users/${after.uid}`).get()
      customer = { ...userRef.data()}
      mail = after.email
    } else {
      // eslint-disable-next-line no-console
      console.error("no bike????")
    }
    if (bike.color && bike.color.hex) {
      theBike = `${bike.make} ${bike.model}`
      htmlBike = `"&nbsp;<span style="background-color:${bike.color.hex};color:${fg(bike.color.hex)}">&nbsp; ${bike.make} ${bike.model} &nbsp;</span>&nbsp;`
    } else {
      htmlBike = theBike = bike.make ? `${bike.make} ${bike.model}` : "bike"
    }
    let linkData = {...after}
    delete(linkData.path)
    delete(linkData.sig)
    const theData = {
      job: after, theBike, htmlBike, bike, customer, 
      inDate: moment(after.date).format("dddd, Do MMMM"),
      dueDate: moment(after.DueDate).format("dddd, Do MMMM"),
      linkJobSend: "https://bikefix.co.uk/j/hash#" + JSURL.stringify(linkData),
    }
    const egData = JSON.stringify(theData, null, 2)
    const moveData = {count: 0, ...moveDataRef.data(), egData, last:hashNow()}
    await moveRef.set({...moveData, count: ++moveData.count, last:hashNow()})
    if (moveData.body && moveData.body.trim()) {
      // eslint-disable-next-line no-console
      console.log("send to", mail)
      const move = createSSRApp({
        data() {
          return theData
        },
        template: moveData.body,
      })
      try {
        let html = await renderToString(move)
        return sendMail(mail, html, theBike, after.forCustomer ? "" : after.id )
      } catch(e) {
        // eslint-disable-next-line no-console
        console.log("template", moveData.body)
        // eslint-disable-next-line no-console
        console.error(e, move)
      }
    }
  }
  sendMsgMail(after)
}

exports.jobClaim = functions.region('europe-west2').firestore.document('users/{uid}/jobs/{jid}').onCreate((doc, context) => {
  const {uid, jid} = context.params
  const after  = {...doc.data(),  id: jid, uid}
  if (after && after.from && !after.to) {
    // eslint-disable-next-line no-console
    console.log(`claim from ${after.from} to ${after.id}`)
    return claim(uid, jid, after, doc.ref)
  }
  return null
})

// copy signed jobs to users/{uid}/jobs/{jid}/versions/{vid}
exports.jobAddVersion = functions.region('europe-west2').firestore.document('users/{uid}/jobs/{jid}').onWrite((change, context) => {
  const {uid, jid} = context.params
  const before = {...change.before.data(), id: jid, uid}
  const after  = {...change.after.data(),  id: jid, uid}
  if (change.before.exists && Object.keys(change.before.data()).length > 2) {
    addVersions(uid, jid, before)
    // eslint-disable-next-line no-console
    console.log("add version",        after.id)
  }
  return null
})

exports.jobSendNotifications = functions.region('europe-west2').firestore.document('users/{uid}/jobs/{jid}').onWrite((change, context) => {
  const {uid, jid} = context.params
  const before = {...change.before.data(), id: jid, uid}
  const after  = {...change.after.data(),  id: jid, uid}
  if (change.before.exists && !after.to && !after.forCustomer) {
    return sendNotifications(uid, jid, before, after)
  }
  return null
})

exports.jobEmails = functions.region('europe-west2').firestore.document('users/{uid}/jobs/{jid}').onWrite((change, context) => {
  // eslint-disable-next-line no-console
  console.log("send emails 1")
  const {uid, jid} = context.params
  const before = {...change.before.data(), id: jid, uid}
  const after  = {...change.after.data(),  id: jid, uid}
  // eslint-disable-next-line no-console
  console.log("send emails 2", after.id)
  return sendEmails(uid, jid, before, after)
})

// Create a user document when a new user is created
exports.create = functions.region('europe-west2').auth.user().onCreate((event) => {
  let {uid, email, displayName, phoneNumber, photoURL, emailVerified} = event
  // TODO: type eg. bikeshop
  // biz eg. bfx or pzb
  let permissions = {
    bikeshop: {
      bfx: {
        uid,
        role: 'client'
      }
    }
  }
  return sign(permissions, prvKey, sig => {
    permissions.sig = sig
    
    let userDoc = {permissions, emailVerified, photoURL, phoneNumber, displayName, email}

    if (email) {
      userDoc._email = email
    }
    if (displayName) {
      userDoc._displayName = displayName
    }
    if (phoneNumber) {
      userDoc._phoneNumber = phoneNumber
    }
    if (photoURL) {
      userDoc._photoURL = photoURL
    }
    userDoc.event = JSON.stringify(event)

    fs.collection(`/events`).add({newUser:userDoc})
    return fs.doc(`/users/${uid}`).set(userDoc)
  })
})
