const express = require("express");
const passport = require("../passport");
const router = express.Router();
const mongoose = require("mongoose");
const cloudinary = require("cloudinary");
const Book = require("../models/book");
const User = require("../models/user");
const BookCollections = require("../models/bookCollections");
const List = require("../additional");

router.get("/newBook", passport.checkAuth, function (req, res) {
    console.log(List.genres);
    res.render("newBook", {
        user: req.user,
        genres: List.genres
    });
});
router.post("/addBook", passport.checkAuth, function (req, res) {
    console.log(req.body);
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
                res.redirect(`/books/${id}`);
            });
        } catch (err) {
            res.render("infopage", {});
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
                            res.redirect(`/books/${id}`);
                        });
                    } catch (err) {
                        console.log(err);
                        res.render("infopage", {
                            err
                        });
                    }
                }
            )
            .end(req.files.ava_field.data);
    }
});

router.get("/books", passport.checkAuth, function (req, res) {
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
                let count = Math.ceil(data.length / 5);
                if (!req.query.page || parseInt(req.query.page) < 0) {
                    page = 0;
                } else if (parseInt(req.query.page) + 1 > count) {
                    page = count - 1;
                } else {
                    page = parseInt(req.query.page);
                }

                let newData = new Array();

                for (let i = page * 5; i < page * 5 + 5 && i < data.length; i++) {
                    newData.push(data[i]);
                }
                if ((page + 1) * 5 < data.length) next = page + 1;
                else next = page;
                if (page - 1 >= 0) prev = page - 1;
                else prev = page;
                res.render("books", {
                    books: newData,
                    next,
                    count,
                    prev,
                    page: page + 1,
                    user,
                    genres: List.genres
                });
            }
        });
    } catch (err) {
        res.render("infopage", {
            user
        });
    }

});

router.post("/deteBook", function (req, res) {
    const id = req.body.id;
    let user = req.user;
    try {
        Book.delete(id)
            .then(() => res.redirect("/books"))
            .catch(err => res.status(500).send(err.toString()));
    } catch (err) {
        res.render("infopage", {
            user
        });
    }
});
router.get("/selectGenre", passport.checkAuth, function (req, res) {
    const genre = req.query.name;
    Book.getByGenre(genre)
        .then(books => {
            res.render("books", {
                books: books,
                user: req.user,
                genres: List.genres
            });
        }).catch(err => res.status(500).send(err.toString()));

});
router.get("/books/:id", passport.checkAuth, (req, res) => {
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

            console.log(role);
            res.render("book", {
                name: data.name,
                BooksCollections: coll,
                description: data.description,
                year: data.year,
                rating: data.rating,
                genre: data.genre,
                author: data.author,
                publisher: data.publisher,
                image: data.image,
                id: req.params.id,
                role: role,
                user,
                book: data,

            });;;

        });

});
router.post("/addBookInCollection", function (req, res) {
    let bookId = mongoose.Types.ObjectId(req.body.id);
    let id = req.body.coll;

    if (id) {
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
            .then(x => {
                res.redirect(`/books/${bookId}`);
            }).catch(x => {
                res.render(`infopage`, {
                    err: "Виберіть в яку колекцію добавити книгу"
                });
            });
    } else {
        res.render(`infopage`, {
            err: "Виберіть в яку колекцію добавити книгу"
        });
    }
});

router.get("/updateBook", passport.checkAuth, function (req, res) {
    console.log(req.user);
    const id = req.query.id;
    Book.getById(id).then(data => {
        if (data.creatorId === req.user.id || req.user.role === 1) {
            res.render("update", {
                name: data.name,
                description: data.description,
                year: data.year,
                rating: data.rating,
                genre: data.genre,
                author: data.author,
                publisher: data.publisher,
                id: id,
                image: data.image.substring(46),
                user: req.user,
                genres: List.genres

            });
        } else {
            res.render("infopage", {
                err: "У вас немає доступу до цієї сторінки"
            });
        }
    });
});
router.post("/updateBook", function (req, res) {
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
                res.redirect(`/books/${updBook.id}`);
            });

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
                            res.redirect(`/books/${book.id}`);
                        });
                }
            )
            .end(req.files.ava_field.data);
    }
});
module.exports = router;