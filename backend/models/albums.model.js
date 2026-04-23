const mongoose = require('mongoose')

const AlbumSchema = new mongoose.Schema({
    albumId: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    ownerId: {
        type: String,
        required: true,
    },
    sharedUsers: [{
        type: String,
    }],
})

const Album = mongoose.model("Album", AlbumSchema)

module.exports = { Album }