import * as functions from "firebase-functions/v1";
// const functions = require("firebase-functions/v1");
import * as Typesense from "typesense";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

const app = initializeApp();
const db = getFirestore(app);

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

export type user = {
    displayName: string | undefined
    name: string | undefined
    email: string | undefined
    phone: string | undefined
    phoneNumber: string | undefined
}
export type dateHash = string

export type part = {
    id: string
    displayName: string
    title: string
    "Last Order": string
    "Ordered by": string
    "Supplier Part No": string
    Supplier_ID: string
    category: string
    cost: number
    itemPrice: number
    jobDescription: string
    labourPrice: number
    make: string
    model: string
    weight: number
    content: string
}
export interface chat {
    [key: string]: msg
}
export type msg = {
    date: dateHash
    txt: string | null
    image: string | null
    video: string | null
}
export type Bike = {
    id: string
    displayName: string
    model: string
    make: string
    color: string
}

export type Job = {
    displayName: string
    id: string
    due: dateHash
    dueAtShop: dateHash
    bike: string
    updated: dateHash
    phone: string
    email: string
    sig: string
    path: string
    name: string
    chat: chat
    services: part[]
    to: string
    status: string
    Booked: dateHash | string
    ToDo: dateHash | string
    Ready: dateHash | string
    AwaitingCustomer: dateHash | string
    AwaitingParts: dateHash | string
    Collected: dateHash | string
    filed: dateHash | string
    theBike: Bike | null | undefined
    theBikeMake: string
    theBikeModel: string
    theServices: string
    forCustomer: user
}

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
function dateFormHash(dateHash: dateHash): Date {
  return new Date(parseInt(dateHash||"11111" as dateHash, 36) * (15*60*1000));
}
/**
 * @param {Job} job
 * @return {string} status of job
 */
function getStatus(job: Job) {
  return statuses.reduce((a, v) => {
    console.log(dateFormHash(job[a as keyof Job] as dateHash));
    if (job[v as keyof Job] &&
      ((job[a as keyof Job] || "11111") < (job[v as keyof Job] || "11112"))) {
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
      const {uID, id} = context.params;
      console.log("Updating Typesense for user", uID, "job", id);

      const userRef = db.doc("users/"+uID);
      const user = await userRef.get();

      if (!change.after.exists) { // deleted
        return typesense.collections("jobs").documents(id).delete();
      }
      let job = change.after.data() as Job;
      job.status = getStatus(job);

      const userData = job.forCustomer || user.data() as user;
      const n = job.forCustomer ? job.forCustomer.name : userData.displayName;
      const e = job.forCustomer ? job.forCustomer.email : userData.email;
      const userPhone = userData.phone || userData.phoneNumber;
      const p = job.forCustomer ? job.forCustomer.phone : userPhone;
      job = {
        ...job,
        name: n || "",
        phone: p || "",
        email: e || "",
        bike: job.bike || "",
        updated: job.updated || "",
        due: job.due || "",
        dueAtShop: job.dueAtShop || "",
        Booked: job.Booked || "",
        ToDo: job.ToDo || "",
        Ready: job.Ready || "",
        AwaitingCustomer: job.AwaitingCustomer || "",
        AwaitingParts: job.AwaitingParts || "",
        Collected: job.Collected || "",
        filed: job.filed || "",
        status: getStatus(job as Job),
        id: change.after.id,
      } as Job;
      if (job.bike) {
        const bike = await userRef.collection("bikes").doc(job.bike).get();
        job.theBike = bike.data() as Bike;
      }

      job.theBikeMake = (job.theBike ? job.theBike.make : "") || "";
      job.theBikeModel = (job.theBike ? job.theBike.model : "") || "";
      if (Array.isArray(job.services)) {
        job.theServices = job.services.map((s) => s.title).join(", ");
      } else {
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
    
exports.users = require("./users")
exports.sync  = require("./sync")

