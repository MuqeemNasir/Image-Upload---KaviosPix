const express = require('express')
const { initializeDatabase } = require('./db/db.connect')

const multer = require('multer')
const cloudinary = require('cloudinary')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy

const { User } = require('./models/user.model')
const { Album } = require('./models/albums.model')
const { Image } = require('./models/image.model')

const authMiddleware = require('./middlewares/auth')
const { use } = require('passport')
const { access } = require('fs')
const { userInfo } = require('os')

dotenv.config()
const app = express()
app.use(cors())
app.use(bodyParser.json())

initializeDatabase()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/tmp')
    }
})
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase()
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
            cb(null, true)
        } else {
            cb(new Error("Only image files are allowed (jpg, png, gif)"), false)
        }
    }
})

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value
            let user = await User.findOne({ email })

            if (!user) {
                user = new User({ userId: uuidv4(), email, googleId: profile.id })
                await user.save()
            }
            return done(null, user)
        } catch (error) {
            return done(error, false)
        }
    }
))

app.use(passport.initialize())

app.get("/auth/google", passport.authenticate('google', { scope: ['profile', 'email'], session: false }))

app.get("/auth/google/callback", passport.authenticate('google', { session: false, failureRedirect: '/' }), (req, res) => {
    const token = jwt.sign(
        { userId: req.user.userId, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    )
    res.redirect(`${process.env.FRONTEND_URL}/?token=${token}&email=${req.user.email}`)
})

// app.post("/auth/google", async (req, res) => {
//     try {
//         const { email, googleId } = req.body

//         let user = await User.findOne({ email })
//         if (!user) {
//             user = new User({ userId: uuidv4(), email, googleId })
//             await user.save()
//         }

//         const token = jwt.sign({ userId: user.userId, email: user.email },
//             process.env.JWT_SECRET, { expiresIn: '7d' }
//         )
//         res.status(200).json({ token, user })
//     } catch (error) {
//         res.status(500).json({ message: "Authentication Failed", error: error.message })
//     }
// })


app.post("/albums", authMiddleware, async (req, res) => {
    try {
        const { name, description } = req.body
        if (!name) return res.status(400).json({ message: "Name is required." })

        const album = new Album({
            albumId: uuidv4(),
            name,
            description,
            ownerId: req.user.userId,
            sharedUsers: []
        })
        await album.save()
        res.status(201).json(album)
    } catch (error) {
        res.status(500).json({ message: "Failed to create album", error: error.message })
    }
})

app.get("/albums", authMiddleware, async (req, res) => {
    try {
        const albums = await Album.find({
            $or: [{ ownerId: req.user.userId }, { sharedUsers: req.user.email }]
        })
        res.status(200).json(albums)
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch albums", error: error.message })
    }
})

app.put("/albums/:albumId", authMiddleware, async (req, res) => {
    try {
        const album = await Album.findOneAndUpdate(
            { albumId: req.params.albumId, ownerId: req.user.userId },
            { description: req.body.description },
            { new: true }
        )

        if (!album) {
            return res.status(403).json({ message: "Not authorized or album not found." })
        }
        res.status(200).json(album)
    } catch (error) {
        res.status(500).json({ message: "Failed to update album", error: error.message })
    }
})

app.post("/albums/:albumId/share", authMiddleware, async (req, res) => {
    try {
        const album = await Album.findOne({
            albumId: req.params.albumId,
            ownerId: req.user.userId
        })

        if (!album) {
            return res.status(403).json({ message: "Not authorized or album not found." })
        }

        album.sharedUsers.push(...req.body.emails)
        await album.save()
        res.status(200).json({ message: "Album shared", album })
    } catch (error) {
        res.status(500).json({ message: "Failed to share album", error: error.message })
    }
})

app.delete("/albums/:albumId", authMiddleware, async (req, res) => {
    try {
        const album = await Album.findOneAndDelete({
            albumId: req.params.albumId,
            ownerId: req.user.userId,
        })

        if (!album) {
            return res.status(403).json({ message: "Not authorized or album not found." })
        }

        await Image.deleteMany({ albumId: req.params.albumId })
        res.status(200).json({ message: "Album and its images deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: "Failed to delete album.", error: error.message })
    }
})

app.post("/albums/:albumId/images", authMiddleware, upload.single("file"), async (req, res) => {
    try {
        const album = await Album.findOne({
            albumId: req.params.albumId,
            $or: [{ ownerId: req.user.userId }, { sharedUsers: req.user.email }]
        })

        if (!album) {
            return res.status(403).json({ message: "You don't have access to this album" })
        }

        if (!req.file) {
            return res.status(400).json({ message: "No Image file provided." })
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'KaviosPix'
        })

        const tags = req.body.tags ? JSON.parse(req.body.tags) : []

        const newImage = new Image({
            imageId: uuidv4(),
            albumId: album.albumId,
            imageUrl: result.secure_url,
            name: req.file.originalname,
            tags: tags,
            person: req.body.person || "",
            isFavorite: req.body.isFavorite === "true",
            size: req.file.size
        })

        await newImage.save()
        res.status(201).json({ message: "Image Uploaded Successfully.", image: newImage })
    } catch (error) {
        res.status(500).json({ message: "Image upload failed", error: error.message })
    }
})

app.get("/albums/:albumId/images", authMiddleware, async (req, res) => {
    try {
        const album = await Album.findOne({
            albumId: req.params.albumId,
            $or: [{ ownerId: req.user.userId }, { sharedUsers: req.user.email }]
        })

        if (!album) {
            return res.status(403).json({ message: "No access to this album." })
        }

        let query = { albumId: req.params.albumId }

        if (req.query.tags) {
            const tagRegexes = req.query.tags.split(',').map(tag => new RegExp(tag.trim(), 'i'))
            query.tags = { $in: tagRegexes }
        }

        const images = await Image.find(query)
        res.status(200).json(images)
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch images", error: error.message })
    }
})

app.get("/albums/:albumId/images/favorites", authMiddleware, async (req, res) => {
    try {
        const images = await Image.find({ albumId: req.params.albumId, isFavorite: true })
        res.status(200).json(images)
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch favorites", error: error.message })
    }
})

app.put("/albums/:albumId/images/:imageId/favorite", authMiddleware, async (req, res) => {
    try {
        const image = await Image.findOneAndUpdate(
            { imageId: req.params.imageId },
            { isFavorite: req.body.isFavorite },
            { new: true }
        )
        res.status(200).json(image)
    } catch (error) {
        res.status(500).json({ message: "Failed to update favorite image", error: error.message })
    }
})

app.post("/albums/:albumId/images/:imageId/comments", authMiddleware, async (req, res) => {
    try {
        const image = await Image.findOne({ imageId: req.params.imageId })
        image.comments.push(req.body.comment)
        await image.save()
        res.status(200).json(image)
    } catch (error) {
        res.status(500).json({ message: "Failed to add comment", error: error.message })
    }
})

app.delete("/albums/:albumId/images/:imageId", authMiddleware, async (req, res) => {
    try {
        const album = await Album.findOne({
            albumId: req.params.albumId,
            ownerId: req.user.userId
        })

        if (!album) {
            return res.status(403).json({ message: "Only the album owner can delete images." })
        }

        await Image.findOneAndDelete({ imageId: req.params.imageId })
        res.status(200).json({ message: "Image deleted successfully." })
    } catch (error) {
        res.status(500).json({ message: "Failed to delete image", error: error.message })
    }
})



if (process.env.NODE_ENV !== 'production') {
    const PORT = 4000
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
}

module.exports = app