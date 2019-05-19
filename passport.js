const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const config = require("./config");
const User = require("./models/user");


passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.getById(id)
        .then(user => {
            done(user ? null : 'No user', user);
        });
});

passport.use("sign_up", new LocalStrategy({
    usernameField: "username",
    passwordField: "password",
    session: false
}, (username, password, done) => {
    try {



        User.createUser(username, password).then(user => {
            return done(null, user);
        }).catch(err => {
            done(err, false, {
                message: "User allready exist"
            });
        });


    } catch (err) {
        done(err);
    }
}));

passport.use("sign_in", new LocalStrategy({
    usernameField: "username",
    passwordField: "password",
    session: false
}, (username, password, done) => {
    console.log(username);
    try {
        User.findByLogin(username).then(async u => {
            if (!u) {
                return done(null, false, {
                    message: ""
                });
            } else {
                if (await User.comparePasswords(username, password)) {
                    return done(null, u);
                } else {
                    return done(null, false, {
                        message: ""
                    });
                }
            }
        });
    } catch (err) {
        done(err);
    }
}));
module.exports = {
    checkAdmin: function (req, res, next) {
        if (!req.user) return res.redirect(`/reg`); // 'Not authorized'
        else if (req.user.role !== 1) res.render("infopage", {
            err: "У вас немає доступу до цієї сторінки"
        }); // 'Forbidden'
        else next(); // пропускати далі тільки аутентифікованих із роллю 'admin'
    },


    checkAuth: function (req, res, next) {
        if (!req.user) return res.redirect(`/reg`); // 'Not authorized'
        next(); // пропускати далі тільки аутентифікованих
    }
};