const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const { response } = require('express')
const uri = "mongodb+srv://syedmd:" + process.env.PW + "@cluster0.sox3hbe.mongodb.net/db1?retryWrites=true&w=majority"
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });


app.use(cors())

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

//Create schema for the database
const exerciseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: String
},{ _id: false });
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  log: [exerciseSchema] //array of exerciseSchema
},{versionKey: false});


const Session = mongoose.model('Session', exerciseSchema);
const User = mongoose.model('User', userSchema);


app.post('/api/users', bodyParser.urlencoded({ extended: false }), (req, res) => { //create new user
  let newUser = new User({ username: req.body.username }); //create new user
  newUser.save((err, data) => {
    if (!err) {
      let userObj = {};
      userObj['username'] = data.username;
      userObj['_id'] = data._id;
      res.json(userObj);
    }
    else {
      res.send(err);
    }
  })
});

app.get('/api/users', (req, res) => { //get all users
  User.find({}, (err, data) => {  //User.find() returns an array of all users , we gave {} as the first argument to find all users
    if (!err) {
      res.json(data);
    }
    else {
      res.send(err);
    }
  })
});


app.post('/api/users/:_id/exercises', bodyParser.urlencoded({ extended: false }), (req, res) => { //add exercise to user
  let datex = req.body.date;
  if(req.body.date === '' || req.body.date === null){
    datex = new Date().toDateString();
  }
  let newSession = new Session({ description: req.body.description, duration: req.body.duration, date: datex });
  User.findByIdAndUpdate(req.params._id, { $push: { log: newSession } }, { new: true }, (err, data) => { //find user by id and update log array with new session
    //$push adds newSession to the log array
    if (!err) {
      let userObj = {}; //create user object
      userObj['_id'] = data._id;
      userObj['username'] = data.username;
      userObj['date'] = new Date(newSession.date).toDateString()
      userObj['duration'] =  parseInt(newSession.duration);
      userObj['description'] = newSession.description;
      res.json(userObj); //return user object
    }
    else {
      res.send(err);
    }
  })
});


app.get('/api/users/:_id/logs', (req, res) => { //get user's exercise log
  let userId = req.params._id;
  User.findById(userId, (err, data) => {
    if (!err) {
      let userObj = {};
      userObj['_id'] = data._id;
      userObj['username'] = data.username;
      userObj['log'] = data.log;
      userObj['count'] = data.log.length;
      res.json(userObj);
    }
    else {
      res.send(err);
    }
  })
});
