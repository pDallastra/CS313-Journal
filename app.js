//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// const {Pool, Client} = require('pg');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');


const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));
// const _ = require('lodash');
app.use(session({
    secret: "Trying to learn something here",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb+srv://admin-dallastra:@Tp88125707@cluster0-tk19t.mongodb.net/journalDB', {useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    title: String,
    content: String
});

const postSchema = {
    title: String,
    content: String,
    user_id: String
};

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('User', userSchema);
const Post = new mongoose.model('Post', postSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', function (req, res) {
    if (req.isAuthenticated()) {
        res.render('home');
    } else {
        res.render('checkUser');
    }
});

app.get('/home', function (req, res) {
    if (req.isAuthenticated()) {
        const checkId = req.user.id;
        Post.find({
            user_id: checkId
        }, function (err, posts) {
            res.render('home', {
                posts: posts
            });
        })

    } else {
        res.redirect('/');
    }
});

app.get('/register', function (req, res) {
    res.render('register', {})
});

app.post('/register', function (req, res) {

    User.register({
        username: req.body.username
    }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect('/register');
        } else {
            passport.authenticate('local')(req, res, function () {
                res.redirect('home');
            })
        }
    });
});

app.post('/login', function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate('local')(req, res, function () {
                res.redirect('home');
            });
        }
    })
});

app.get('/login', function (req, res) {
    res.render('/')
});

app.get('/submit', function (req, res) {
    if (req.isAuthenticated()) {
        res.render('home');
    } else {
        res.render('/');
    }

});

app.post('/submit', function (req, res) {
    User.findById(req.user.id, function (err, foundUser) {
        if (err) {
            console.log(err);
            res.redirect('/');
        } else {
            if (foundUser) {
                const newPost = new Post({
                    title: req.body.title,
                    content: req.body.content,
                    user_id: req.user.id
                });
                newPost.save(function () {
                    res.redirect('home');
                })
            }
        }
    })
});

app.post('/delete', function (req, res) {
    const id = req.body.deleteItem;
    Post.findByIdAndRemove(id, function(err){
        const checkId = req.user.id;
        Post.find({user_id: checkId}, function(err, posts){
            res.render('home',{
                posts: posts
            });
    })})
});

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function () {
    console.log("Server started Successfully");
});