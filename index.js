const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;

// Middleware///

app.use(cors())
app.use(express.json())

const verifyJwt = (req, res, next) => {
    const authorization = req.headers.authorization
    if (!authorization) {
        return res.status(401).send({ error: true, massage: 'Unauthorized user' })
    }
    const token = authorization.split(' ')[1]

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, massage: 'Unauthorized access' })
        }
        req.decoded = decoded
        next()
    })

}
app.get('/', (req, res) => {
    res.send('Tunig on the rythme')
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.poxvpxp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const studentCollection = client.db('MusicClass').collection('student')
        const classCollection = client.db('MusicClass').collection('classes')

        app.post('/jwt', (req, res) => {
            const student = req.body
            const token = jwt.sign(student, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            res.send({ token })

        })


        // default Student post from client side
        app.post('/student', async (req, res) => {
            const student = req.body
            const query = { email: student.email }
            const existingStudent = await studentCollection.findOne(query)
            if (existingStudent) {
                return res.send({ massage: 'This student already have account' })
            }
            const result = await studentCollection.insertOne(student)
            res.send(result)
        })

        // default Student get API
        app.get('/student', async (req, res) => {
            const result = await studentCollection.find().toArray()
            res.send(result)

        })

        app.get('/student/admin/:email', verifyJwt, async (req, res) => {
            const email = req.params.email

            if (req.decoded.email !== email) {
                return res.send({ admin: false })
            }
            const query = { email: email }
            const user = await studentCollection.findOne(query)
            const result = { admin: user?.role === 'admin' }
            res.send(result)
        })



        // app.get('/student/instructor/:email', verifyJwt, async (req, res) => {
        //     const email = req.params.email

        //     if (req.decoded.email !== email) {
        //         res.send({ instructor: false })
        //     }8
        //     const query = { email: email }
        //     const user = await studentCollection.findOne(query)
        //     const result = { admin: user?.role === 'instructor' }
        //     res.send(result)

        // })


        // default Student upadte for admin & instructor API

        app.patch('/student/admin/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'admin',
                }
            }
            const result = await studentCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.patch('/student/instructor/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'instructor',
                }
            }
            const result = await studentCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        // classes API >>>> POST class/////

        app.post('/classes', async (req, res) => {
            const newclasses = req.body
            const result = await classCollection.insertOne(newclasses)
            res.send(result)
        })


        app.delete('/student/admin/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await studentCollection.deleteOne(query)
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`Rythm of music is running now${port}`)
})