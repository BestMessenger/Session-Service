const express = require('express')
const cors = require('cors')
const sessionRouter = require('./routes/session')
const swaggerDocs = require('./swagger')
const app = express()


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use('/session', sessionRouter)


const port = 6000
app.listen(port, () => {
    console.log(`Listening on port: ${port}`)
    swaggerDocs(app, port)
})
