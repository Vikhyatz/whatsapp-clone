// initializing variables
var express = require('express');
var router = express.Router();
var passport = require("passport")
var localStrategy = require('passport-local')
var userModel = require("./users")
var messageModel = require("./messages")

// passport auth
passport.use(new localStrategy(userModel.authenticate()))

// signin route
router.get('/', function (req, res) {
  res.render('index');
});

// register post route
router.post('/register', function (req, res) {
  const userData = new userModel({
    username: req.body.username,
    email: req.body.email
  })

  userModel.register(userData, req.body.password)
    .then(function () {
      passport.authenticate("local")(req, res, function () {
        res.redirect('/profilepicture')
      })
    })
})

// login post route
router.post('/login', passport.authenticate("local", {
  failureRedirect: "/login"
}), function (req, res) {
  res.redirect('/chats')
});

// login route
router.get('/login', function (req, res) {
  res.render('login')
})

// username check route to ensure new user does not keep the same username, usernames should be unique
router.get('/usernamecheck/:usernameInp', async function (req, res) {
  const usernameToCheck = req.params.usernameInp;

  const existingUser = await userModel.findOne({
    username: usernameToCheck
  });

  res.json(existingUser);
});

// home/chats route
router.get('/chats', isLoggedIn, async function (req, res) {
  const currentUserId = req.user._id;
  const friends = await userModel.findOne({ _id: currentUserId }).populate("friends");
  const user = await userModel.findOne({ username: req.session.passport.user })

  res.render('chats', { friends, user })
})

// search route
router.get('/search', isLoggedIn, async function (req, res) {
  res.render('search')
})

// searching get route
router.get('/search/:username', async function (req, res) {
  const regexPattern = new RegExp(`^${req.params.username}`, 'i');
  const currentUserId = req.user._id;

  const currentUser = await userModel.findById(currentUserId).populate("friends");
  const friendIds = currentUser.friends.map(friend => friend._id);

  const users = await userModel.find({
    username: regexPattern,
    _id: { $ne: currentUserId, $nin: friendIds }
  });

  res.json(users);
});

// adding friend functionality route
router.get('/addfriend/:friendId', async function (req, res) {
  const FriendId = req.params.friendId
  const myUserId = req.user._id

  await userModel.findByIdAndUpdate(myUserId, { $push: { friends: FriendId } });
  await userModel.findByIdAndUpdate(FriendId, { $push: { friends: myUserId } });

  res.json('both are friends now')
})

// individual room chatting route
router.get('/mainchat', isLoggedIn, async function (req, res) {
  const friendname = req.query.name.trim();
  const regexPattern = new RegExp(`^${friendname}`, 'i');

  const receiverId = await userModel.findOne({ username: regexPattern })
  const myUserId = req.user._id

  const sortedIdArray = [receiverId._id, myUserId].sort()

  const roomName = `${sortedIdArray[0]}_${sortedIdArray[1]}`


  res.render('mainchat', { friendname, roomName, myUserId, receiverId })
})

// to fetch old messages
router.get('/getChats/:roomName', async function (req, res) {
  roomName = req.params.roomName
  const retrievedChat = await messageModel.findOne({ roomName: roomName })

  res.json(retrievedChat);
});

// profile route
router.get('/profile', isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  })

  res.render('profile', { user })
})

// profile picture route
router.get('/profilepicture', isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  })

  res.render('profilepicture', { user })
})

// update profile picture
router.post('/updateProfilePicture', async function (req, res) {
  try {
    const pfpUrl = req.body.url; // Assuming the URL is sent in the request body
    const myUserId = req.user._id;

    const updatedUser = await userModel.findByIdAndUpdate(
      myUserId,
      { $set: { profilePicture: pfpUrl } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json('Profile picture set.');
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// logout route
router.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})

router.get('/allusers', async function (req, res) {
  let allusers = await userModel.find()
  res.send(allusers)
})

router.get('/allmessages', async function (req, res) {
  let allusers = await messageModel.find()
  res.send(allusers)
})

router.get('/deleteallmessages', async function (req, res) {
  let deleted = await messageModel.deleteMany()
  res.send(deleted)
})

router.get('/deleteall', async function (req, res) {
  let deleted = await userModel.deleteMany()
  res.send(deleted)
})


// this function differentiates the pages which require logged in user
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next()
  res.redirect("/")
}

module.exports = router;
