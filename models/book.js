const mongoose = require('mongoose');
const BookSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    genre: {
        type: String,
        required: true
    },
    author: {
        type: String
    },
    year: {
        type: Number
    },
    image: {
        type: String
    },
    isAvailable: {
        type: Boolean
    },
    rating: {
        type: Number
    },
    publisher: {
        type: String
    },
    lastOrder: {
        type: Date
    },
    description: {
        type: String
    },
    creatorID: {
        type: String
    },
});
const BookModel = mongoose.model('Book', BookSchema);

function Book(id, name, author, genre, year, image, isAvailable, rating, publisher, lastOrder, description, creatorID) {
    this.name = name;
    this.author = author;
    this.genre = genre;
    this.publisher = publisher;
    this.rating = rating;
    this.year = year;
    this.id = id;
    this.isAvailable = isAvailable;
    this.image = image;
    this.description = description;
    this.lastOrder = lastOrder;
    this.creatorID = creatorID;
}


module.exports = {
    getAll: function () {
        return BookModel.find();
    },
    getById: function (id) {
        return BookModel.findOne({
            "_id": (id)
        });
    },
    delete: function (id) {
        return BookModel.deleteOne({
            "_id": (id)
        });
    },

    insert: function (x) {
        return new BookModel(x).save();


    },
    createBook: function (id, name, author, genre, year, image, isAvailable, rating, publisher, lastOrder, description, creatorID) {
        return new Book(id, name, author, genre, year, image, isAvailable, rating, publisher, lastOrder, description, creatorID);

    },
    update: function (x, name, description, author, genre, year, image, isAvailable, publisher, lastOrder, rating) {

        return BookModel.findByIdAndUpdate(x.id, {
            $set: {
                name: name,
                description: description,
                author: author,
                genre: genre,
                year: year,
                rating: rating,
                image: image,
                isAvailable: isAvailable,
                publisher: publisher,
                lastOrder: lastOrder
            }
        });
    },
    getByGenre: function (genre) {
        return BookModel.find({
            genre: genre
        });
    }


};