const express = require("express");
const router = express.Router();
const User = require("../models/user");
const cloudinary = require("cloudinary");
const passport = require("../passport");

router.get("/users/:id", passport.checkAdmin, (req, res) => {
    const u = req.user;
    const id = u.id;
    let showCh = true;
    if (req.params.id.toString() === id.toString())
        showCh = null;
    User.getById(req.params.id)
        .then(data => {
            let role = "Звичайний користувач";
            if (data.role === 1) {
                role = "Адмін";
            }
            res.render("user", {
                user: data,
                role: role,
                fullname: data.fullname,
                showCh: showCh
            });
        })
        .catch(err => {
            res.render("infopage", {
                u
            });
        });
});
router.post("/chnrole", (req, res) => {
    const id = req.body.id;
    User.getById(id)
        .then(data => {
            let role = data.role;

            if (role !== 1) role = 1;
            else role = 0;
            return User.changeRole(id, role);
        })
        .then(x => {
            res.redirect("/users");
        });
    // User.changeRole(req.body.id, req.body.role)
    //     .then(() => res.redirect("/users"));
});
router.get("/users", passport.checkAdmin, (req, res) => {
    const user = req.user;
    User.getAll().then(data => {
        res.render("users", {
            users: data,
            user: user
        });
    });
});
router.get("/profile", passport.checkAuth, (req, res) => {
    const user = req.user;
    res.render("profile", {
        user: user,
        image: user.avaUrl.substring(46)
    });
});

router.post("/updUSer", passport.checkAuth, (req, res) => {
    const user = req.user;
    const fullname = req.body.fullname;
    let pass;
    if (req.body.pass1) {
        pass = req.body.pass1;
    } else {
        pass = null;
    }
    let ava;
    if (!req.files.avaNew) {
        ava = "http://res.cloudinary.com/ntuu-kpi/raw/upload/" + req.body.avaOld;
        User.update(user, pass, ava, fullname)
            .then(x => {
                res.redirect(`/profile`);
            });

    } else {
        cloudinary.v2.uploader.upload_stream({
                resource_type: 'raw'
            },
            (error, result) => {
                if (error)
                    console.log(error);
                let ava = result.url;

                User.update(user, pass, ava, fullname)
                    .then(x => {
                        res.redirect(`/profile`);
                    });

            }).end(req.files.avaNew.data);
    }
});

module.exports = router;