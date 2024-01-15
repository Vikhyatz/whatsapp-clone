const mongoose = require("mongoose")
const plm = require("passport-local-mongoose")

mongoose.connect(
  "mongodb+srv://vikhyat:vikhyat123@clusterv.gydmg0e.mongodb.net/whatsappclone?retryWrites=true&w=majority")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((e) => {
    console.log("Couldn't connect to MongoDB", e);
  })


const userschema = mongoose.Schema({
  username: String,
  email: String,
  password: String,
  profilePicture: String,
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }]
})

userschema.plugin(plm)

module.exports = mongoose.model("user", userschema)