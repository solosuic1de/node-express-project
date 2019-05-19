const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Book = require("./book");
const fs = require('fs');
const BooksCollectionsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    books: [{
        type: Schema.Types.ObjectId,
        ref: 'Book',
    }],
    description: {
        type: String,
    },
    privacy: {
        type: Boolean
    },
    avaUrl: {
        type: String
    }
});
const ColectionModel = mongoose.model('BooksCollections', BooksCollectionsSchema);

function BooksCollections(id, name, books, description, privacy, avaUrl) {
    this.id = id;
    this.name = name;
    this.books = books;
    this.description = description;
    this.privacy = privacy;
    this.avaUrl = avaUrl;
}

module.exports = {
    getAll: function () {
        return ColectionModel.find().populate("books")
            .then(result => {
                let collections = new Array();
                if (!Array.isArray(result)) {
                    return new Error("No collections in DB");
                }
                for (const value of result) {
                    collections.push(new BooksCollections(value.id, value.name, value.books, value.description, value.privacy, value.avaUrl));
                }
                return collections;
            });
    },
    getById: function (id) {
        return ColectionModel.findById(id).populate("books").exec()
            .then(value => {
                if (value) {
                    return new BooksCollections(value.id, value.name, value.books, value.description, value.privacy, value.avaUrl);
                }
                return new Error("No have collections with this id");
            });
    },

    insert: function (x) {
        return new ColectionModel(x).save();


    },
    createBooksCollections: function (id, name, list, description, privacy, avaUrl) {
        return new BooksCollections(id, name, list, description, privacy, avaUrl);

    },
    update: function (x) {
        if (!(x instanceof BooksCollections)) {
            return Promise.reject(new Error("Element should be a collection"));
        }
        return ColectionModel.findByIdAndUpdate(x.id, x, {
            new: true
        }).populate("Book");
    },
    deletBS: function (books, bookId, collId) {
        let booksArr = books;
        for (let i = 0; i < booksArr.length; i++) {
            let tmp = booksArr[i];
            if (tmp.id.toString() === bookId.toString()) {
                booksArr.splice(i, 1);
            }
        }
        return ColectionModel.findByIdAndUpdate({
            _id: collId
        }, {
            $set: {
                books: books
            }
        });
    },

    getByBook: function (id) {
        return ColectionModel.find({
                books: id
            }).populate("Book")
            .then(result => {
                let collect = new Array();
                for (const value of result) {
                    collect.push(new BooksCollections(value.id, value.name, value.books, value.description, value.privacy, value.avaUrl));
                }
                return collect;
            });
    },
    delete: function (id) {
        return ColectionModel.deleteOne({
            "_id": (id)
        });
    },

    addBookInCollection: function (x, id) {
        return ColectionModel.findByIdAndUpdate(x, {
            $set: {
                books: id,

            }
        });
    },
    getBooks: function (id) {
        return ColectionModel.findById(id).populate("Book").exec()
            .then(value => {
                if (value) {
                    return (value.books);
                }
                return new Error("No have books in collection");
            });
    },
    BooksCollectionsSchema,
    getPublicCollection: function () {
        return ColectionModel.find({
            privacy: null
        }).populate("books").exec();
    },
    Schema
};