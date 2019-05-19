const express = require("express");
const passport = require("passport");
const User = require("../models/user");
const router = express.Router();

router.post("/registration", function (req, res) {

    User.createUser(req.body.username, req.body.password)
        .then(user => {
            return res.redirect(`/`);
        }).catch(err => {
            res.render("infopage", {
                err: "Користувач з таким логіном вже зареєстрований"
            });
        });
});

router.post('/login',
    passport.authenticate('sign_in', {
        successRedirect: '/',
        failureRedirect: '/logerr'
    }));

router.get('/logerr', (req, res) => {
    res.render("infopage", {
        err: "Неправильний логін чи пароль"
    });
});
router.get("/reg", function (req, res) {
    res.render("register", {});
});

router.post('/logout',
    (req, res) => {
        req.logout();
        res.redirect('/');
    });

module.exports = router;