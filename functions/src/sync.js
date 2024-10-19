// keys
// {"crv":"P-256","ext":true,"key_ops":["verify"],"kty":"EC","x":"86P-wMy_0Hq8EOziW9LJgSLz7JPMOctj5HVsqt5XS0Q","y":"s3n-CRWuA8x7Trwhw_mgrMGp0HrljFvCrvBKu4fXx08"}
// {"crv":"P-256","d":"9hdpveEK5OE2VPwOhwrSzcOvbnhSLjjnoi5WVWgw8mE","ext":true,"key_ops":["sign"],"kty":"EC","x":"86P-wMy_0Hq8EOziW9LJgSLz7JPMOctj5HVsqt5XS0Q","y":"s3n-CRWuA8x7Trwhw_mgrMGp0HrljFvCrvBKu4fXx08"}


const functions = require('firebase-functions/v1')
const admin = require('firebase-admin')
admin.initializeApp()
const db = admin.database().ref('pages')
const dbParts = admin.database().ref('parts')
// const cleaner = require('clean-html')
// const options = {
//  'add-remove-tags': ['span',]
// }

exports.fireDeletePages = functions.firestore.document('/anywhere/{pageId}').onDelete(snap => {
  const pageId = snap.id
  return db.child(pageId).set(null)
})
exports.fireWritePages = functions.firestore.document('/anywhere/{pageId}').onWrite(change => {
  const pageDoc = change.after.data()
  const pageId = change.after.id

  const {published} = pageDoc

  if (!published) {
    return db.child(pageId).set(null)
  }
  //return cleaner.clean(pageDoc.content, options, function (content) {
    delete(pageDoc.published)
    delete(pageDoc.date)
    return db.child(pageId).set(pageDoc)
  //})
})
exports.fireDeleteInfoPageSync = functions.firestore.document('/services/{pageId}').onDelete(snap => {
  const pageId = snap.id
  return db.child(pageId).set(null)
})
exports.fireWriteInfoPages = functions.firestore.document('/services/{pageId}').onWrite(change => {
  const pageDoc = change.after.data()
  const pageId = change.after.id

  const {published = false} = pageDoc

  if (!published) {
    return db.child(pageId).set(null)
  }
  delete(pageDoc.published)
  delete(pageDoc.date)
  return db.child(pageId).set(pageDoc)
})
exports.fireDeleteParts = functions.firestore.document('/bikeshop/bfx/parts/{pageId}').onDelete(snap => {
  const pageId = snap.id
  return dbParts.child(pageId).set(null)
})
exports.fireWriteParts = functions.firestore.document('/bikeshop/bfx/parts/{pageId}').onWrite(change => {
  const pageDoc = change.after.data()
  const pageId = change.after.id

  // eslint-disable-next-line no-console
  console.log("parts", pageDoc)
  
  const published = !!pageDoc.jobDescription
  if (!published) {
    return dbParts.child(pageId).set(null);
  }
  const page = {
    title:       pageDoc.displayName,
    category:    pageDoc.category || "###",
    content:     pageDoc.jobDescription,
    price:       +pageDoc.itemPrice + +pageDoc.labourPrice,
    itemPrice:   +pageDoc.itemPrice,
    labourPrice: +pageDoc.labourPrice,
    weight:      +pageDoc.weight,
  }
  return dbParts.child(pageId).set(page)
})
