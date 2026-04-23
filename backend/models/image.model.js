const mongoose = require('mongoose')

const ImageSchema = new mongoose.Schema({
    imageId: {
        type: String,
        required: true,
        unique: true,
    },
    albumId: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    tags: [{
        type: String,
    }],
    person: {
        type: String,
    },
    isFavorite: {
        type: Boolean,
        default: false,
    },
    comments: [{
        type: String,
    }],
    size: {
        type: Number,
    },
    uploadedAt: {
        type: Date,
        default: Date.now()
    }
})

const Image = mongoose.model("Image", ImageSchema)

module.exports = { Image }