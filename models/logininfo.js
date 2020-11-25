const mongoose = require("mongoose")
const schema = mongoose.Schema

const loginSchema = new schema({

    email : String,
    name : String,
    mobile : String,
    pwd : String
})

module.exports = mongoose.model('logininfo', loginSchema)