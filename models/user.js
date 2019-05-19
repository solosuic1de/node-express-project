const mongoose = require("mongoose");
const BooksCollection = require("../models/bookCollections");
const crypto = require("crypto");
const Schema = mongoose.Schema;
const defInf = "e-library читач";
const UserSchema = new mongoose.Schema({
    login: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: Number
    },
    fullname: {
        type: String
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    avaUrl: {
        type: String
    },
    isDisabled: {
        type: Boolean
    },
    password: {
        type: String,
        required: true
    },
    collections: [{
        type: Schema.Types.ObjectId,
        ref: "BooksCollections"
    }]
});

const UserModel = mongoose.model("user", UserSchema);

function User(
    id,
    login,
    role,
    fullname,
    registeredAt,
    avaUrl,
    isDisabled,
    password,
    collections
) {
    this.id = id;
    this.login = login;
    this.fullname = fullname;
    this.isDisabled = isDisabled;
    this.password = password;
    this.avaUrl = avaUrl;
    this.registeredAt = registeredAt;
    this.role = role;
    this.collections = collections;
}

module.exports = {
    getById: function (id) {
        return UserModel.findById(id);
    },
    getAll: function () {
        return UserModel.find();
    },
    insert: function (user) {
        return new UserModel(user).save();
    },
    createUser: function (login, password) {
        let d = new Date().toString();
        let hash = crypto
            .createHash("md5")
            .update(password)
            .digest("hex");
        let user = new User(
            null,
            login,
            d,
            defInf,
            null,
            "http://res.cloudinary.com/ntuu-kpi/raw/upload/v1544722414/ma5olj8hnrney5vcoyya",
            null,
            hash
        );
        return new UserModel(user).save();
    },
    findByLogin: async function (login) {
        return await UserModel.findOne({
            login: login
        });
    },

    comparePasswords: async function (login, password) {
        let user = await UserModel.findOne({
            login: login
        });

        let hash = crypto
            .createHash("md5")
            .update(password)
            .digest("hex");
        console.log(user.password);
        console.log(hash);
        if (user.password === hash) {
            return true;
        } else return false;
    },
    update: function (user, newPassword, newAva, fullname) {
        if (newPassword) {
            let hash = crypto.createHash("md5").update(newPassword).digest("hex");
            return UserModel.update({
                _id: user.id
            }, {
                $set: {
                    fullname: fullname,
                    password: hash,
                    avaUrl: newAva
                }
            });
        }
        return UserModel.update({
            _id: user.id
        }, {
            $set: {
                fullname: fullname,
                avaUrl: newAva
            }
        });
    },
    UserModel,
    changeRole: function (id, role) {
        return UserModel.updateOne({
            _id: id
        }, {
            $set: {
                role: role
            }
        });
    },
    getCollection: function (id) {
        return UserModel.findById(id)
            .populate({
                path: "collections",
                populate: [{
                    path: "books"
                }]
            })
            .exec()
            .then(value => {
                if (value) {
                    return value.collections;
                }
                return new Error("No have books in collection");
            });
    },
    addCollection: function (user, collection) {
        return UserModel.update({
            _id: user.id
        }, {
            $set: {
                collections: collection
            }
        });
    }
};