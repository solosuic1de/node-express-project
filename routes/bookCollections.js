const express = require('express');
const router = express.Router();
const cloudinary = require("cloudinary");
const User = require("../models/user");
const passport = require("../passport");
const BooksCollections = require("../models/bookCollections");


router.get('/collections', passport.checkAuth, function (req, res) {
    let user = req.user;
    let id = req.user.id;
    User.getCollection(id)
        .then(data => {
            res.render("collections", {
                BooksCollections: data,
                user: user
            });
        });
});
router.post("/deletefromcoll", passport.checkAuth, function (req, res) {
    const id = req.body.id;
    const bookId = req.body.coll;
    BooksCollections.getById(id)
        .then(data => {
            return BooksCollections.deletBS(data.books, bookId, id);
        }).then(data => {
            res.redirect(`/collections/${data.id}`);
        }).catch(err => res.status(500).send(err.toString()));

});


router.get("/collections/:id", passport.checkAuth, (req, res) => {
    let user = req.user;
    const id = req.params.id;
    const collections = user.collections;
    let owner = null;
    BooksCollections.getById(id)
        .then(data => {
            for (let i = 0; i < collections.length; i++) {
                let tmp = collections[i];
                if ((tmp.toString()) === (id.toString()))
                    owner = 1;
            }
            res.render("collection", {
                collections: data,
                books: data.books,
                owner: owner,
                user
            });
        });
});
router.get("/newCollection", passport.checkAuth, (req, res) => {
    res.render("newCollection", {
        user: req.user
    });
});
router.post("/addcollection", passport.checkAuth, function (req, res) {
    let redirectID;
    let user = req.user;
    let privacy = null;
    if (req.body.privacy_field)
        privacy = true;
    let coll;
    console.log(req.body);
    if (!req.user.collections) {
        coll = new Array();
    } else {
        coll = req.user.collections;
    }
    const name = req.body.name_field;
    const description = req.body.description_field;
    let writePath;
    let id;
    if (!req.files.ava_field) {
        let collection = BooksCollections.createBooksCollections(null, name, null, description, privacy, "http://res.cloudinary.com/ntuu-kpi/raw/upload/v1544826924/drztprnmajmx1lsh9lxc");
        try {
            BooksCollections.insert(collection)
                .then(x => {
                    id = x._id;
                    redirectID = id.toString();

                    coll.push(x);
                    return User.addCollection(user, coll);
                }).then(x => {

                    res.redirect(`/collections/${redirectID}`);

                });
        } catch (err) {
            res.render("infopage", {
                user
            });
        }
    } else {

        cloudinary.v2.uploader.upload_stream({
                resource_type: 'raw'
            },
            (error, result) => {
                if (error)
                    console.log(error);
                writePath = result.url;
                let collection = BooksCollections.createBooksCollections(null, name, null, description, privacy, writePath);
                try {
                    BooksCollections.insert(collection)
                        .then(x => {
                            id = x.id;
                            redirectID = id.toString();
                            coll.push(x);
                            return User.addCollection(user, coll);
                            return User.addCollection(user, x);
                        }).then(x => {
                            res.redirect(`/collections/${redirectID}`);
                        });
                } catch (err) {
                    res.render("infopage", {
                        user
                    });
                }
            }).end(req.files.ava_field.data);
    }


});
router.post("/deleteColl", function (req, res) {
    const id = req.body.id;
    BooksCollections.delete(id)
        .then(() => res.redirect("/collections"))
        .catch(err => res.status(500).send(err.toString()));

});

router.get("/allCollections", passport.checkAuth, function (req, res) {
    BooksCollections.getPublicCollection()
        .then(data => {
            res.render("collections", {
                BooksCollections: data,
                user: req.user
            });
        });
});
module.exports = router;