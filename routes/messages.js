const mongoose = require("mongoose")

const messageSchema = mongoose.Schema({
    roomName: String,
    messages: [{
        senderId: String,
        messageSent: String
    }]
})

module.exports = mongoose.model("message", messageSchema)