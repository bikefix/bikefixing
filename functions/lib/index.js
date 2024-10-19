"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions/v1");
// const functions = require("firebase-functions/v1")
const Typesense = require("typesense");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const app = (0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)(app);
const typesense = new Typesense.Client({
    nodes: [
        {
            host: "ts.bikefix.co.uk",
            port: 443,
            protocol: "https",
        },
    ],
    apiKey: "WB8FxLnGo4Jx0xiyPi39YcDGFuGzvkTn2zqcM9ppPI35epzZ",
    connectionTimeoutSeconds: 20000,
});
const statuses = [
    "Booked",
    "ToDo",
    "Ready",
    "AwaitingCustomer",
    "AwaitingParts",
    "Collected",
    "filed",
];
/**
 * @param {dateHash} dateHash
 * @return {Date} date
 */
function dateFormHash(dateHash) {
    return new Date(parseInt(dateHash || "11111", 36) * (15 * 60 * 1000));
}
/**
 * @param {Job} job
 * @return {string} status of job
 */
function getStatus(job) {
    return statuses.reduce((a, v) => {
        console.log(dateFormHash(job[a]));
        if (job[v] &&
            ((job[a] || "11111") < (job[v] || "11112"))) {
            return v;
        }
        return a;
    }, "Booked");
}
/*
 * This function is triggered when a new job is created or updated
 * It will update the Typesense index
 */
exports.updateTypesenceJobs = functions.region("europe-west2").
    firestore.document("users/{uID}/jobs/{id}").
    onWrite(async (change, context) => {
    const { uID, id } = context.params;
    console.log("Updating Typesense for user", uID, "job", id);
    const userRef = db.doc("users/" + uID);
    const user = await userRef.get();
    if (!change.after.exists) { // deleted
        return typesense.collections("jobs").documents(id).delete();
    }
    let job = change.after.data();
    job.status = getStatus(job);
    const userData = job.forCustomer || user.data();
    const n = job.forCustomer ? job.forCustomer.name : userData.displayName;
    const e = job.forCustomer ? job.forCustomer.email : userData.email;
    const userPhone = userData.phone || userData.phoneNumber;
    const p = job.forCustomer ? job.forCustomer.phone : userPhone;
    job = Object.assign(Object.assign({}, job), { name: n || "", phone: p || "", email: e || "", bike: job.bike || "", updated: job.updated || "", due: job.due || "", dueAtShop: job.dueAtShop || "", Booked: job.Booked || "", ToDo: job.ToDo || "", Ready: job.Ready || "", AwaitingCustomer: job.AwaitingCustomer || "", AwaitingParts: job.AwaitingParts || "", Collected: job.Collected || "", filed: job.filed || "", status: getStatus(job), id: change.after.id });
    if (job.bike) {
        const bike = await userRef.collection("bikes").doc(job.bike).get();
        job.theBike = bike.data();
    }
    job.theBikeMake = (job.theBike ? job.theBike.make : "") || "";
    job.theBikeModel = (job.theBike ? job.theBike.model : "") || "";
    if (Array.isArray(job.services)) {
        job.theServices = job.services.map((s) => s.title).join(", ");
    }
    else {
        job.theServices = "";
    }
    if (job.to) {
        return typesense.collections("jobs").documents(id).delete();
    }
    if (!change.before.exists) { // new
        return typesense.collections("jobs").documents().create(job);
    }
    return typesense.collections("jobs").documents(id).update(job);
});
//exports.users = require("./users")
//exports.sync  = require("./sync")
//# sourceMappingURL=index.js.map