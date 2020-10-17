const express = require('express');
const app = express();
const data = require("./Lab3-timetable-data.json");
const data_count = Object.keys(data).length;

var subject_array = [];

// Make an array of all subjects for drop down menu
for (i = 0; i < data_count; i++) {
    subject_array[i] = data[i].subject; 
}

// Delete duplicates in array for unique subjects
function removeDuplicates(array) {
    return array.filter((a, b) => array.indexOf(a) === b)
};

subject_array = removeDuplicates(subject_array);

//console.log(subject_array); *USED THIS TO CREATE A DROP DOWN LIST OF ITEMS FOR BROWSERSIDE JAVASCRIPT DOM MANIPULATION*

app.use(express.static('Public'));

app.listen(3000, () => console.log('Listening on port 3000'));