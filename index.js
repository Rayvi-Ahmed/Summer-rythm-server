const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;

// Middleware///

app.use(cors())
app.use(express.json())

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