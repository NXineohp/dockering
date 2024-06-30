const express = require("express");
const app = express();
const fs = require("fs");
const cors = require("cors");
const port = 8080;
const filename = __dirname + "/profs.json";

const { MongoClient, ObjectId } = require('mongodb'); // Ensure ObjectId is imported
const { TrackOpTypes } = require("vue");
const { parse } = require("path");
// MongoDB connection URI
const uri = "mongodb://localhost:27017/";


//Middleware
app.use(express.json()); //for parsing application/json
app.use(cors()); //for configuring Cross-Origin Resource Sharing (CORS)
function log(req, res, next) {
    console.log(req.method + " Request at" + req.url);
    next();
}
app.use(log);


//Endpoints
app.get("/profs", async function (req, res) {
    let client;
    try {
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db('profDB');
        const collection = database.collection('professors');
        const result = await collection.find().toArray();
        console.log(`Found the following records:`);
        console.log(result);
        res.send(result); // Sendet das Ergebnis als Antwort
    }
    catch (err) {
        console.error('Error connecting to MongoDB or retrieving documents', err);
        res.status(500).send('Error connecting to MongoDB or retrieving documents'); // Sendet den Fehlerstatus und die Nachricht als Antwort
    } finally {
        await client.close();
    }
});

app.get("/profs/:name", async function (req, res) {
    let client;
    try {
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db('profDB');
        const collection = database.collection('professors');
        // Extrahiere den Namen aus den Request-Parametern
        const name = req.params.name;
        // Suche das Dokument basierend auf dem Namen
        const document = await collection.findOne({ name: name });
        if (document) {
            console.log("Document found");
            res.status(200).json(document);
        } else {
            console.log("No document found");
            res.status(404).json({ message: "Document not found" });
        }
    } catch (err) {
        console.error('Error connecting to MongoDB or fetching document', err);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error connecting to MongoDB or fetching document' });
        }
    } finally {
        if (client) await client.close();
    }
});

app.put("/profs/:id", async function (req, res) {
    let client;
    try {
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db('profDB');
        const collection = database.collection('professors');
        // Konvertiere den id-Parameter in einen ObjectId
        const id = new ObjectId(req.params.id);
        // Aktualisiere das Dokument basierend auf der _id
        const result = await collection.updateOne({ _id: id }, { $set: { name: req.body.name, rating: req.body.rating } });
        if (result.modifiedCount === 0) {
            console.log("No document was updated");
            res.status(404).json({ message: "Document not found" });
        } else {
            console.log(`Updated ${result.modifiedCount} document(s)`);
            res.status(200).json({ message: "Document updated", count: result.modifiedCount });
        }
    } catch (err) {
        console.error('Error connecting to MongoDB or updating document', err);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error connecting to MongoDB or updating document' });
        }
    } finally {
        if (client) await client.close();
    }
});

app.delete("/profs/:id", async function (req, res) {
    let client;
    try {
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db('profDB');
        const collection = database.collection('professors');

        // Finde alle Dokumente in der Sammlung
        const documents = await collection.find({}).toArray();

        const index = parseInt(req.params.id);
        // Überprüfen, ob der Index gültig ist
        const result = await collection.deleteOne({ _id: documents[index]._id });
        res.status(200).json({ message: "Document deleted!"});
        
    } catch (err) {
        console.error('Error deleting or finding document:', err);
        return { success: false, message: 'Error deleting or finding document' };
    } finally {
        await client.close();
    }
});


app.post("/profs", async function (req, res) {
    let client;
    try {
        // Validierung der Eingabedaten
        if (!req.body.name || !req.body.rating) {
            return res.status(400).json({ message: "Name and rating are required" });
        }

        client = new MongoClient(uri);
        await client.connect();
        const database = client.db('profDB');
        const collection = database.collection('professors');
        const result = await collection.insertOne({
            name: req.body.name,
            rating: req.body.rating,
        });
        console.log(`New document created with the following id: ${result.insertedId}`);
        res.status(200).json({ message: "Document inserted", id: result.insertedId });
    } catch (err) {
        console.error('Error connecting to MongoDB or inserting document', err);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error connecting to MongoDB or inserting document' });
        }
    } finally {
        if (client) await client.close();
    }
});

app.listen(port, () => console.log(`Server listening on port ${port}!`));