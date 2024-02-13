// Import required modules
const express = require("express");
const fs = require("fs");
const path = require("path");

// Helper method for generating unique ids
const uuid = require("./helpers/uuid");

// Specify on which port the Express.js server will run
const PORT = process.env.PORT || 3001;

// Initialize an instance of Express.js
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Get request, sends back the index.html page
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "/public/index.html"))
);
// Get request, sends back the notes.html page
app.get("/notes", (req, res) =>
  res.sendFile(path.join(__dirname, "/public/notes.html"))
);

// GET request for notes
// reads the db.json file and sends back the parsed JSON data
app.get("/api/notes", (req, res) => {
  fs.readFile("./db/db.json", "utf8", (err, data) => {
    let jsonData = JSON.parse(data);
    console.log(jsonData);
    res.json(jsonData);
  });
});

// Reads newly added notes from the req body and adds them to the db.json
const readThenAppendToJson = (addedNote, file) => {
  fs.readFile(file, "utf8", (err, data) => {
    if (err) {
      console.error(err);
    } else {
      // Convert string into JSON object
      const parsedData = JSON.parse(data);
      // Add a new note
      parsedData.push(addedNote);
      writeNewNoteToJson(file, parsedData);
    }
  });
};

// Write data back to db.json
const writeNewNoteToJson = (destination, content) =>
  fs.writeFile(destination, JSON.stringify(content, null, 4), (err) =>
    err ? console.error(err) : console.info(`\nData written to ${destination}`)
  );

// POST request to add a note
app.post("/api/notes", (req, res) => {
  // Destructuring for the items in req.body
  const { title, text } = req.body;
  //Check If all the required properties are present
  if (title && text) {
    // Variable for the object we will save
    const newNote = {
      title: title,
      text: text,
      id: uuid(),
    };

    // Obtain existing notes then append to json
    readThenAppendToJson(newNote, "./db/db.json");

    const response = {
      status: "success",
      body: newNote,
    };

    res.json(response);
  } else {
    res.json("Error in posting new note");
  }
});

//Delete /api/notes/:id
//reads the db.json file, uses the json objects uuids to match the object to be deleted, removes that object from the db.json file, then re-writes the db.json file
app.delete("/api/notes/:id", (req, res) => {
  let id = req.params.id;
  let parsedData;
  fs.readFile("./db/db.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
    } else {
      parsedData = JSON.parse(data);
      const filterData = parsedData.filter((note) => note.id !== id);
      writeNewNoteToJson("./db/db.json", filterData);
    }
  });
  res.send(`Deleted note with ${req.params.id}`);
});

// listening for incoming connections on the specified port
app.listen(PORT, () =>
  console.log(`App listening at http://localhost:${PORT}`)
);
