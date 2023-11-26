const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;


// middlewares
app.use(cors({
    origin: ["http://localhost:5173"]
}));
app.use(express.json());



// Database user and password
const dbUser = process.env.DB_USER
const dbPass = process.env.DB_PASS



// MongoDB code snippet
const uri = `mongodb+srv://${dbUser}:${dbPass}@cluster0.xeklkbf.mongodb.net/?retryWrites=true&w=majority`;

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
        // await client.connect();


        // Database and colletion
        const userCollection = client.db("glideParcel").collection("users");


        // // Post new user to the database
        app.post("/user", async (req, res) => {
            const user = req.body;

            // checking if the user already exists
            const query = { email: user.email };
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: "User already exists", insertedId: null });
            }
            else {
                const result = await userCollection.insertOne(user);
                res.send(result);
            }
        });

        




        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get("/", (req, res) => {
    res.send("Glide Parcel is running ok.")
});

app.listen(port, () => {
    console.log(`Glide Parcel is running on port: ${port}`)
});