const express = require('express');
const app = express();
const data = require("./Lab3-timetable-data.json")

app.use(express.static('Public'));

app.listen(3000, () => console.log('Listening on port 3000'));