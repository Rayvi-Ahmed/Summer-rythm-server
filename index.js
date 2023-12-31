const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY)

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

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.poxvpxp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
// 
const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-nazopu5-shard-00-00.poxvpxp.mongodb.net:27017,ac-nazopu5-shard-00-01.poxvpxp.mongodb.net:27017,ac-nazopu5-shard-00-02.poxvpxp.mongodb.net:27017/?ssl=true&replicaSet=atlas-10cbix-shard-0&authSource=admin&retryWrites=true&w=majority`

const client = new MongoClient(uri, { useUnifiedTopology: true }, { useNewUrlParser: true }, { connectTimeoutMS: 30000 }, { keepAlive: 1 });
async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const studentCollection = client.db('MusicClass').collection('student')
        const classCollection = client.db('MusicClass').collection('classes')
        const bookedCollection = client.db('MusicClass').collection('booked')
        const paymentCollection = client.db('MusicClass').collection('payments')



        app.post('/jwt', (req, res) => {
            const student = req.body
            const token = jwt.sign(student, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            res.send({ token })

        })


        // Admin Veryfy token///

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await studentCollection.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ error: true, message: 'forbidden message' });
            }
            next();
        }

        const verifyInstrctor = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await studentCollection.findOne(query);
            if (user?.role !== 'instructor') {
                return res.status(403).send({ error: true, message: 'forbidden message' });
            }
            next();
        }

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


        // API for load all Instructors////
        app.get('/student/instructor', async (req, res) => {
            const result = await studentCollection.find().toArray()
            res.send(result)
        })

        // useAdmin API////

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


        // useInstructor API////
        app.get('/student/instructor/:email', verifyJwt, async (req, res) => {
            const email = req.params.email

            if (req.decoded.email !== email) {
                return res.send({ instructor: false })
            }
            const query = { email: email }
            const user = await studentCollection.findOne(query)
            const result = { instructor: user?.role === 'instructor' }
            res.send(result)

        })

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

        app.patch('/student/instructor/:id', verifyJwt, async (req, res) => {
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

        // app.get('/classes/add/:email', verifyJwt, verifyInstrctor, verifyAdmin, async (req, res) => {
        //     const email = req.params.email
        //     if (!email) {
        //         return res.send([])
        //     }
        //     const query = { email: email }
        //     const result = await classCollection.find(query).toArray()
        //     res.send(result)

        // })

        app.get('/classes/:email', async (req, res) => {
            const email = req.query.email
            if (!email) {
                return res.send([])
            }
            const query = { email: email }
            const result = await classCollection.findOne(query)
            res.send(result)

        })


        app.get('/classes', async (req, res) => {
            const result = await classCollection.find().toArray()
            res.send(result)
        })


        app.post('/booked', async (req, res) => {
            const course = req.body
            console.log(course)
            const result = await bookedCollection.insertOne(course)
            res.send(result)

        })

        app.get('/booked', async (req, res) => {
            const email = req.query.email
            if (!email) {
                return res.send([])
            }
            const query = { email: email }
            const result = await bookedCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/booked/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await bookedCollection.findOne(query)
            res.send(result)
        })

        app.patch('/classes/approve/:id', verifyJwt, async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: 'approve',
                }
            }
            const result = await classCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.patch('/classes/deny/:id', verifyJwt, async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: 'denied',
                }
            }
            const result = await classCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.patch('/classes/feedback/:id', async (req, res) => {
            const id = req.params.id
            const body = req.body
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    feedback: body,
                }
            }
            const result = await classCollection.updateOne(filter, updateDoc)
            res.send(result)
        })


        app.delete('/student/admin/:id', verifyJwt, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await studentCollection.deleteOne(query)
            res.send(result)
        })


        // Payment API Create///
        app.post('/create-payment-intent', verifyJwt, async (req, res) => {
            console.log('hello')
            const { price } = req.body
            const amount = (price) * 100
            const paymentIntent = await stripe.paymentIntents.create({

                amount: amount,
                currency: 'aud',
                payment_method_types: ['card']

            });
            console.log(amount)
            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })

        app.post('/payments', verifyJwt, async (req, res) => {
            const payment = req.body
            payment.date = new Date()
            const id = payment.selectedId
            const insertResult = await paymentCollection.insertOne(payment)

            const query = { _id: new ObjectId(id) }
            const deleteResult = await bookedCollection.deleteOne(query)

            res.send({ insertResult, deleteResult })
        })


        app.get('/payments', verifyJwt, async (req, res) => {
            const email = req.query.email
            if (!email) {
                return res.send([])
            }
            const query = { email: email }
            const result = await paymentCollection.find(query).toArray()
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