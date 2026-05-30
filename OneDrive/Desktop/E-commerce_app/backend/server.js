import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/mongodb.js'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import connectCloudinary from './config/cloudinary.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 4000

connectDB()
connectCloudinary()

app.use(express.json())
app.use(cors())

app.use('/api/user', userRouter)
app.use('/api/product', productRouter)

app.get('/', (req, res) => {
  res.send("API Working")
})

app.listen(port, () => {
  console.log("Server Started")
})