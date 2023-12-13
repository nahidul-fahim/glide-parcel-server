const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;




// middlewares
app.use(cors({
    origin: ["http://localhost:5173", "https://glide-parcel.web.app"]
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
        const bookingCollection = client.db("glideParcel").collection("bookings");
        const reviewsCollection = client.db("glideParcel").collection("reviews");



        // JWT related API
        app.post("/jwt", async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, { expiresIn: '1h' });
            res.send({ token });
        })


        // verify token middleware
        const verifyToken = (req, res, next) => {
            // console.log(req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'Unauthorized 01' });
            }
            const token = req.headers.authorization.split(' ')[1]
            jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'Unauthorized 02' });
                }
                req.decoded = decoded;
                next();
            })
        }



        // verify admin middleware
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isAdmin = user?.userType === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: "Forbidden access!" })
            };
            next();
        }


        // verify if admin
        app.get("/users/admin/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.userType === "admin";
            };
            res.send({ admin });
        });


        // verify if delivery man
        app.get("/users/deliveryman/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let deliveryMan = false;
            if (user) {
                deliveryMan = user?.userType === "delivery man";
            };
            res.send({ deliveryMan });
        });




        // Post new user to the database
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


        // post new review data to database
        app.post("/review", async (req, res) => {
            const newReview = req.body;
            const result = await reviewsCollection.insertOne(newReview);
            res.send(result);
        })


        // Post new parcel booking data to database
        app.post("/booking", async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })


        // post in the delivery man community
        app.post("/newcommunitypost", async (req, res) => {
            const newPost = req.body;
            // const result = await 
        })



        // get all the booked parcels by all users
        app.get("/allbookings", async (req, res) => {
            const result = await bookingCollection.find().toArray();
            res.send(result);
        })



        // get all the users
        app.get("/allusers", async (req, res) => {
            const query = { userType: "user" };
            const result = await userCollection.find(query).toArray();
            res.send(result);
        })




        // get all the parcels booked by a single user
        app.get("/booking", async (req, res) => {
            const email = req.query.email;
            const bookingStatus = req.query.bookingStatus;

            // Build the query object with email
            const query = { email: email };

            // Conditionally add the bookingStatus field to the query
            if (bookingStatus && bookingStatus.toLowerCase() !== 'all') {
                query.bookingStatus = { $regex: bookingStatus, $options: 'i' };
            }
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        });




        // get a single parcel for a user
        app.get("/booking/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingCollection.findOne(query);
            res.send(result);
        });


        // get a single user
        app.get("/user/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await userCollection.findOne(query);
            res.send(result);
        });


        //get all the delivery man
        app.get("/deliveryman", async (req, res) => {
            const query = { userType: "delivery man" }
            const result = await userCollection.find(query).toArray();
            res.send(result);
        })


        // get all the dliveries for a single delivery man
        app.get("/deliveries/:id", async (req, res) => {
            const deliveryManId = req.params.id;
            const query = { deliveryManId: deliveryManId }
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })


        // get all the ratings for a single delivery man
        app.get("/allrating/:id", async (req, res) => {
            const id = req.params.id;
            const query = { deliveryMan: id };
            const result = await reviewsCollection.find(query).toArray();
            res.send(result)
        })


        //get all the review of all delivery man
        app.get("/allreviews", async (req, res) => {
            const result = await reviewsCollection.find().toArray();
            res.send(result);
        })



        // get all the reviews for a particular delivery man
        app.get("/reviews/:id", async (req, res) => {
            const deliveryMan = req.params.id;
            const query = { deliveryMan: deliveryMan };
            const result = await reviewsCollection.find(query).toArray();
            res.send(result);
        })


        // get all the delivered parcels
        app.get("/alldelivered", async (req, res) => {
            const query = "completed";
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })



        // get a single delivery man
        app.get("/singledeliveryman/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await userCollection.findOne(query);
            res.send(result);
        })



        // get parcel tracking result for homepage
        app.get("/homeparceltracking", async (req, res) => {

            // get parcel tracking id
            const parcelTrackerId = req?.query?.id;

            const trackingQuery = { _id: new ObjectId(parcelTrackerId) }

            const options = {
                projection: {
                    _id: 0,
                    bookingStatus: 1
                },
            }
            const trackingResult = await bookingCollection.findOne(trackingQuery, options);
            res.send({ trackingResult });
        })




        // get stats for homepage
        app.get("/homestats", async (req, res) => {

            // get total bookings
            const totalBookings = await bookingCollection.estimatedDocumentCount();

            // get total deliveries
            const result = await userCollection.aggregate([
                {
                    $group: {
                        _id: null,
                        totalDelivery: {
                            $sum: '$totalDelivery'
                        }
                    }
                }
            ]).toArray();
            const totalDeliveries = result.length > 0 ? result[0].totalDelivery : 0;

            // get total registered users
            const totalUsers = await userCollection.estimatedDocumentCount();
            res.send({
                totalBookings,
                totalDeliveries,
                totalUsers
            })
        })




        // get deliveryman for homepage
        app.get("/homepagedeliveryman", async (req, res) => {
            const userType = "delivery man";
            const query = { userType: userType };
            const options = {
                sort: {
                    totalDelivery: -1
                },
                limit: 5,
                projection: {
                    _id: 0,
                    name: 1,
                    photo: 1,
                    totalDelivery: 1,
                    avgReview: 1
                },
            }
            const result = await userCollection.find(query, options).toArray()
            res.send(result);
        })



        // update booking details by an admin
        app.put("/updatebyadmin/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedInfoByAdmin = req.body;
            const updateDoc = {
                $set: {
                    deliveryManId: updatedInfoByAdmin.deliveryManId,
                    apprxDelvDate: updatedInfoByAdmin.apprxDelvDate,
                    bookingStatus: updatedInfoByAdmin.bookingStatus
                }
            };
            const result = await bookingCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })


        // update a booking by the user
        app.put("/updatebooking/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedBookingInfo = req.body;
            const updateDoc = {
                $set: {
                    phone: updatedBookingInfo.phone,
                    parcelType: updatedBookingInfo.parcelType,
                    recvName: updatedBookingInfo.recvName,
                    recvPhone: updatedBookingInfo.recvPhone,
                    delvAddress: updatedBookingInfo.delvAddress,
                    delvDate: updatedBookingInfo.delvDate,
                    latitude: updatedBookingInfo.latitude,
                    longitude: updatedBookingInfo.longitude,
                    bookingStatus: updatedBookingInfo.bookingStatus
                }
            };
            const result = await bookingCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })


        // update booking status by a user or delivery man
        app.put("/bookingstatus/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateStatus = req.body;
            const updateDoc = {
                $set: {
                    bookingStatus: updateStatus.bookingStatus
                }
            };
            const result = await bookingCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })


        // updte profile picture
        app.put("/profilePic/:email", async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const options = { upsert: true };
            const updatedImg = req.body;
            const updateDoc = {
                $set: {
                    photo: updatedImg.photo
                }
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })


        // updte total order and total spent by a user
        app.put("/totalorder/:email", async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const options = { upsert: true };
            const addSpent = req.body;
            const updateDoc = {
                $inc: {
                    totalOrder: 1,
                    totalSpent: addSpent.cost
                }
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })



        // increase totalReview
        app.put("/reviewcount/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };

            const newReview = req.body.rating;
            console.log(newReview);
            const deliveryMan = await userCollection.findOne(filter);
            const oldTotalReview = deliveryMan.totalReview;
            const newTotalReview = deliveryMan.totalReview + 1;
            const oldAvgReview = deliveryMan.avgReview;
            console.log(oldAvgReview, typeof oldAvgReview);
            const multification = oldTotalReview * oldAvgReview;
            const reviewSum = multification + newReview;
            const newAvgReview = reviewSum / newTotalReview;
            const updateDoc = {
                $inc: {
                    totalReview: 1
                },
                $set: {
                    avgReview: parseFloat(newAvgReview.toFixed(1))
                }
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })




        // update user type
        app.put("/userrole/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedRole = req.body;
            const updateDoc = {
                $set: {
                    userType: updatedRole.userType,
                    avgReview: 0
                }
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })


        // update total deliveries for a delivery man
        app.put("/totaldelivery/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $inc: {
                    totalDelivery: 1
                }
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })





        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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