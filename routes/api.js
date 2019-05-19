const express = require("express");
const passport = require("../passport");
const router = express.Router();
const mongoose = require("mongoose");
const cloudinary = require("cloudinary");
const Book = require("../models/book");
const User = require("../models/user");
const BooksCollections = require("../models/bookCollections");


router.get("/about", function (req, res) {
    let user = req.user;
    res.send("about", {
        user
    });
});

router.get("/api/users", function (req, res) {
    res.send(User.getAll());
});

router.get("/api/users/:id", function (req, res) {
    res.send(User.getById(Number(req.params.id)));
});
router.post("/addBook", passport.checkAuth, function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    const name = req.body.name_field;
    const author = req.body.author_field;
    const genre = req.body.genre_field;
    const creatorId = req.user.id;
    const yearStr = req.body.year_field;
    const ratingStr = req.body.rating_field;
    const publisher = req.body.publisher_field;
    const description = req.body.description_field;
    let lastOrder = new Date();
    let writePath = "http://res.cloudinary.com/ntuu-kpi/raw/upload/v1544573989/gc1dmcbhzbkus174axwu";
    let availability = true;
    if (!req.files.ava_field) {
        let book = Book.createBook(
            null,
            name,
            author,
            genre,
            parseInt(yearStr),
            writePath,
            availability,
            parseFloat(ratingStr),
            publisher,
            lastOrder,
            description,
            creatorId
        );
        try {
            Book.insert(book).then(x => {
                let id = x.id;
                res.status(200).send(`Успішно добавлено`);
            });
        } catch (err) {
            res.send("infopage", {});
        }
    } else {
        cloudinary.v2.uploader
            .upload_stream({
                    resource_type: "raw"
                },
                (error, result) => {
                    if (error) throw new Error(error);

                    writePath = result.url;
                    let book = Book.createBook(
                        null,
                        name,
                        author,
                        genre,
                        parseInt(yearStr),
                        writePath,
                        availability,
                        parseFloat(ratingStr),
                        publisher,
                        lastOrder,
                        description,
                        creatorId
                    );
                    try {
                        Book.insert(book).then(x => {
                            let id = x.id;
                            res.status(200).send(`Успішно добавлено`);
                        }).catch(err => res.status(500).send(err.toString()));
                    } catch (err) {
                        console.log(err);
                        res.status(500).send("Виникла помилка");
                    }
                }
            )
            .end(req.files.ava_field.data);
    }
});
router.get("/books", passport.checkAuth, function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    let user = req.user;
    try {
        Book.getAll().then(data => {
            if (req.query.search) {
                let books = data.filter(x =>
                    new String(x.name.toLowerCase()).includes(
                        req.query.search.toLowerCase()
                    )
                );
                if (books.length === 0) {
                    books = data.filter(x =>
                        new String(x.author.toLowerCase()).includes(
                            req.query.search.toLowerCase()
                        )
                    );
                }
                data = books;
            }
            if (data) {
                let page, next, prev;
                if (!req.query.page) {
                    page = 0;
                } else {
                    page = parseInt(req.query.page);
                }
                let newData = new Array();

                for (let i = page * 10; i < page * 10 + 10 && i < data.length; i++) {
                    newData.push(data[i]);
                }
                if ((page + 1) * 10 < data.length) next = page + 1;
                else next = page;
                if (page - 1 >= 0) prev = page - 1;
                else prev = page;
                const response = {
                    data: {
                        books: newData,
                        next,
                        prev,
                        page,
                        user
                    },
                };
                res.status(200).send(JSON.stringify(response, null, '  '));
            }
        }).catch(err => res.status(500).send(err.toString()));
    } catch (err) {
        res.status(404).send("Виникла якась помилка");
    }
});
router.post("/deteBook", function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    const id = req.body.id;
    try {
        Book.delete(id)
            .then(() => res.status(202).send("Успішно видалено"))
            .catch(err => res.status(500).send(err.toString()));
    } catch (err) {
        res.status(404).send("Виникла якась помилка");
    }
});
router.get("/books/:id", passport.checkAuth, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const user = req.user;
    let coll;
    let role = null;
    const id = req.user.id;
    const BookId = req.params.id;
    if (req.user.role) {
        role = 1;
    }
    User.getCollection(user.id)
        .then(collections => {
            coll = collections;
            return Book.getById(BookId);
        }).then(data => {
            if (role === null) {
                if (data.creatorID === id.toString()) {
                    role = 1;
                }
            }

            const response = {
                data: {
                    name: data.name,
                    BooksCollections: coll,
                    description: data.description,
                    year: data.year,
                    rating: data.rating,
                    genre: data.genre,
                    author: data.author,
                    publisher: data.publisher,
                    image: data.image,

                    book: data
                },
            };
            res.status(200).send(JSON.stringify(response, null, '  '));

        }).catch(err => res.status(500).send(err.toString()));

});
router.post("/addBookInCollection", function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    let bookId = mongoose.Types.ObjectId(req.body.id);
    let id = req.body.coll;
    BookCollections.getById(id)
        .then(data => {
            if (!data.books) {
                data.books = new Array();
            }
            let check = false;
            for (let i = 0; i < data.books.length; i++) {
                let x = data.books[i];
                if ((x.id.toString()) === (bookId.toString()))
                    check = true;
            }
            if (!check) data.books.push(bookId);
            return BookCollections.addBookInCollection(id, data.books);
        })
        .then(() => res.status(202).send("Успішно додано до колекції"))
        .catch(err => res.status(500).send(err.toString()));
});

router.get("/updateBook", passport.checkAuth, function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    console.log(req.user);
    const id = req.query.id;
    Book.getById(id).then(data => {
        if (data.creatorId === req.user.id || req.user.role === 1) {
            const response = {
                data: {
                    name: data.name,
                    description: data.description,
                    year: data.year,
                    rating: data.rating,
                    genre: data.genre,
                    author: data.author,
                    publisher: data.publisher,
                    id: id,
                    image: data.image.substring(46)
                },
            };
            res.status(200).send(JSON.stringify(response, null, '  '));
        } else {
            res.status(403).send("У вас не вистачає прав для доступу до цієї сторінки");

        }
    }).catch(err => res.status(500).send(err.toString()));;
});
router.post("/updateBook", function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    let ava = "http://res.cloudinary.com/ntuu-kpi/raw/upload/" + req.body.ava;
    const name = req.body.name_field;
    const author = req.body.author_field;
    const genre = req.body.genre_field;
    const id = req.body.id;
    const yearStr = req.body.year_field;
    const ratingStr = req.body.rating_field;
    const rating = parseInt(ratingStr);
    const publisher = req.body.publisher_field;
    const description = req.body.description_field;
    let lastOrder = new Date();
    let availability = true;
    if (!req.files.ava_field) {
        Book.getById(id)
            .then(book => {

                return Book.update(book, name, description, author, genre, yearStr, ava, availability, publisher, lastOrder, rating);
            }).then(updBook => {
                res.status(200).send("Успішно оновлено");
            }).catch(err => res.status(500).send(err.toString()));

    } else {
        cloudinary.v2.uploader
            .upload_stream({
                    resource_type: "raw"
                },
                (error, result) => {
                    Book.getById(id)
                        .then(book => {
                            return Book.update(book, name, description, author, genre, yearStr, result.url, availability, publisher, lastOrder, rating);
                        }).then(book => {
                            res.status(200).send("Успішно оновлено");
                        }).catch(err => res.status(500).send(err.toString()));;
                }
            )
            .end(req.files.ava_field.data);
    }
});
router.get('/collections', passport.checkAuth, function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    let user = req.user;
    let id = req.user.id;
    User.getCollection(id)
        .then(data => {
            const response = {
                data: {
                    BooksCollections: data,
                    user: user
                },
            };
            res.status(200).send(JSON.stringify(response, null, '  '));
        }).catch(err => res.status(500).send(err.toString()));;
});
router.get("/collections/:id", passport.checkAuth, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
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
            const response = {
                data: {
                    collections: data,
                    books: data.books,
                    owner: owner,
                    user
                },
            };
            res.status(200).send(JSON.stringify(response, null, '  '));
        }).catch(err => res.status(500).send(err.toString()));;
});

router.post("/addcollection", function (req, res) {
    res.setHeader('Content-Type', 'application/json');
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
                    id = x.id;
                    coll.push(x);
                    return User.addCollection(user, coll);
                }).then(x => {
                    res.status(200).send(`Успішно додано`);
                }).catch(err => res.status(500).send(err.toString()));;
        } catch (err) {
            res.status(500).send(err.toString());
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
                            coll.push(x);
                            return User.addCollection(user, coll);
                            return User.addCollection(user, x);
                        }).then(x => {
                            res.status(200).send(`Успішно додано`);
                        });
                } catch (err) {
                    res.status(500).send(err.toString());
                }
            }).end(req.files.ava_field.data);
    }


});
router.post("/deleteColl", function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    const id = req.body.id;
    BooksCollections.delete(id)
        .then(() => res.status(200).send(`Успішно видалено`))
        .catch(err => res.status(500).send(err.toString()));

});

router.get("/allCollections", function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    BooksCollections.getPublicCollection()
        .then(data => {
            const response = {
                data: {
                    BooksCollections: data
                },
            };
            res.status(200).send(JSON.stringify(response, null, '  '));

        }).catch(err => res.status(500).send(err.toString()));;
});
router.get("/users/:id", passport.checkAdmin, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
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
            const response = {
                data: {
                    user: data,
                    role: role,
                    fullname: data.fullname,
                    showCh: showCh
                },
            };
            res.status(200).send(JSON.stringify(response, null, '  '));

        })
        .catch(err => {
            res.status(500).send(err.toString());
        });
});
router.post("/chnrole", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const id = req.body.id;
    User.getById(id)
        .then(data => {
            let role = data.role;

            if (role !== 1) role = 1;
            else role = 0;
            return User.changeRole(id, role);
        })
        .then(x => {
            res.status(200).send("Роль змінено");
        }).catch(err => res.status(500).send(err.toString()));;
    // User.changeRole(req.body.id, req.body.role)
    //     .then(() => res.redirect("/users"));
});
router.get("/users", passport.checkAdmin, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const user = req.user;

    User.getAll().then(data => {
        const response = {
            data: {
                users: data,
                user: user
            },
        };
        res.status(200).send(JSON.stringify(response, null, '  '));
    }).catch(err => res.status(500).send(err.toString()));;
});

router.get("/profile", passport.checkAuth, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const user = req.user;
    const response = {
        data: {
            user: user,
            image: user.avaUrl.substring(46)
        },
    };
    res.status(200).send(JSON.stringify(response, null, '  '));

});

router.post("/updUSer", passport.checkAuth, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
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
                res.status(200).send("Оновлено");
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
                        res.status(200).send("Оновлено");
                    });

            }).end(req.files.avaNew.data);
    }
});
module.exports = router;