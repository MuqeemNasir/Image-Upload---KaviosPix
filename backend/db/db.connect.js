const mongoose = require('mongoose')

const initializeDatabase = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGODB_URI)
        if (connection) {
            console.log("Mongoose Connected Successfully")
        }
    } catch (error) {
        console.log("Database Connection Failed", error)
    }
}

module.exports = { initializeDatabase }