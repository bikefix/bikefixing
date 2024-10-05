import { createStore } from "vuex"
import { deepEqual } from "./main"
// import { reactive } from "vue"

export type page = {
    updated: dateHash
    url: string
    title: string
    content: string
    more_content: string | null
    image: string | null
    tag: string
    price: number | null
}
export type file = {
    title: string
    url: string
    image: string | null
}
export type bike = {
    id: string
    make: string
    model: string
    color: string
    color2: string
    files: file[]
    uid: string
}
export type supplier = {
  id: string
  description: string
  displayName:string
  partNumber:string
  phone:string
  web:string
}
export type user = {
    _phoneNumber: string
    address: string
    city: string
    country: string
    displayName: string
    email: string
    emailVerified: boolean
    keys: keys
    name: string
    bikeshop: bikeshop 
    phone: string
    phoneNumber: string
    photoURL: string | null
    postcode: string
    sentEmailVerification: boolean
    uid: string
    updated: string
}
export type dateHash = string
export type email = {
    id: string
    body: string
    count: number
    egData: string
    last: dateHash
}
export type part = {
    id: string
    displayName: string
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
export type msg = {
    date: dateHash
    txt: string | null
    image: string | null
    video: string | null
}
export type job = {
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
    status: {	// legacy
      Booked: dateHash | null
      ToDo: dateHash | null
      Ready: dateHash | null
      AwaitingCustomer: dateHash | null
      AwaitingParts: dateHash | null
      Collected: dateHash | null
      filed: dateHash | null
    }		
    Booked: dateHash | null
    ToDo: dateHash | null
    Ready: dateHash | null
    AwaitingCustomer: dateHash | null
    AwaitingParts: dateHash | null
    Collected: dateHash | null
    filed: dateHash | null
}
export interface bikeshop {
    [key: string]: {
        role: string
        uid: string
        sig: string
    }
}
export interface keys {
    [key: string]: dateHash
}
export interface bikes {
    [key: string]: bike
}
export interface closed {
    [key: string]: string
}
export interface content {
    [key: string]: bike
}
export interface emails {
    [key: string]: email
}
export interface jobs {
    [key: string]: job
}
export interface pages {
    [key: string]: page
}
export interface parts {
    [key: string]: part
}
export interface suppliers {
    [key: string]: supplier
}
export interface team {
    [key: string]: user
}
export interface users {
    [key: string]: user
}
export interface chat {
    [key: string]: msg
}
export type state = {
    bikes: bikes
    closed: closed
    content: content
    emails: emails
    jobs: jobs
    jobsList: jobs[]
    jobsSearch: jobSearch[]
    msgList: jobs[]
    pages: pages
    parts: parts
    suppliers: suppliers
    team: team
    user: user
    users: users
}

function updateState(state:state, data: any, type: string): state {
  if (data.id) {
      if (deepEqual(state[type][data.id], data)) {
        return state
      }
      state[type][data.id] == data
      return state
  }
  if (typeof data == "string") {
    delete(state[type][data])
    return state
  }
  if (Array.isArray(data)) {
    data.forEach(doc => {
        if (doc.id && !deepEqual(state[type][doc.id], doc)) {
            state[type][doc.id] = doc
        }
    })
    return state
  }
  Object.keys(data).forEach(key => {
    if (!deepEqual(state[type][key], data[key])) {
      state[type][key] = data[key]
    }
  })
  return state
}
export default createStore({
    state: {
        bikes: {},
        closed: {},
        content: {},
        emails: {},
        jobs: {},
        jobsList: [],
        jobsSearch: [],
        msgList: [],
        pages: {},
        parts: {},
        suppliers: {},
        team: {},
        user: {
            uid: "",
            _phoneNumber: "",
            phoneNumber: "",
            phone: "",
            address: "",
            city: "",
            country: "",
            displayName: "",
            postcode: "",
            email: "",
            emailVerified:false,
            keys: {},
            name: "",
            bikeshop: {},
            photoURL: "",
            sentEmailVerification: false,
            updated: "",

        },
        users: {},
    },
    mutations: {
        jobSearch(state:state, job) {
            if (job.id) {
                return (state.jobsSearch[job.id] = job);
            }
        },
        setMsgList(state:state, list) {
            state.msgList = list;
        },
        setJobsList(state:state, list) {
            state.jobsList = list;
        },
        setUser(state:state, user) {
            state.user = user;
        },
        setPage(state:state, page:page) {
            state = updateState(state, page, "page");
        },
        suppliers(state:state, suppliers) {
            state = updateState(state, suppliers, "suppliers");
        },
        content(state:state, content) {
            state = updateState(state, content, "content");
        },
        emails(state:state, emails) {
            state = updateState(state, emails, "emails");
        },
        pages(state:state, pages) {
            state = updateState(state, pages, "pages");
        },
        bikes(state:state, bikes) {
            state = updateState(state, bikes, "bikes");
        },
        parts(state:state, parts) {
            state = updateState(state, parts, "parts")
        },
        users(state:state, users) {
            state = updateState(state, users, "users");
        },
        jobs(state:state, jobs) {
            state = updateState(state, jobs, "jobs");
        },
    },
    getters: {
        publicParts: (state:state) => {
            let parts = Object.keys(state.parts).reduce((a, partID) => {
                if (state.parts[partID].content) {
                    a.push({ id: partID, ...state.parts[partID], cost:""})
                }
                return a
            }, [])

            return parts
        },
        /* jobsList: state => {
      return Object.keys(state.jobs).map(id => {
        return {id, ...state.jobs[id]}
      })
    }, */
        jobs: (state:state) => {
            return Object.keys(state.jobs).map((id) => {
		if (state.jobs[id].id) return state.jobs[id]
                return { ...state.jobs[id], id }
            })
        },
        team: (state:state) => {
            return Object.keys(state.team).map((id) => {
		if (state.team[id].uid) return state.team[id]
                return { id, ...state.team[id] }
            })
        },
        parts: (state:state) => {
            return Object.keys(state.parts).map((id) => {
		if (state.parts[id].id) return state.parts[id]
                return { id, ...state.parts[id] }
            })
        },
        emails: (state:state) => {
            return Object.keys(state.emails).map((id) => {
		if (state.emails[id].id) return state.emails[id]
                return { id, ...state.emails[id] }
            })
        },
        content: (state:state) => {
            return Object.keys(state.content).map((id) => {
		if (state.content[id].id) return state.content[id]
                return { id, ...state.content[id] }
            })
        },
        suppliers: (state:state) => {
            return Object.keys(state.suppliers).map((id) => {
		if (state.suppliers[id].id) return state.suppliers[id]
                return { id, ...state.suppliers[id] }
            })
        },
    },
    actions: {},
    modules: {},
});
