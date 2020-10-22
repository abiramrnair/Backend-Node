const express = require('express');
const app = express();
const data = require("./Lab3-timetable-data.json");
const data_count = Object.keys(data).length;
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('schedule_database.json');
const db = low(adapter);

app.use(express.static('Public'));

// Database defaults

db.defaults({schedules: []})
.write()

db.get('schedules')
.push({ schedule_id : "Summer School", schedule_information: []})
.write()

db.get('schedules')
.push({ schedule_id: "Main Year", schedule_information: []})
.write()

db.get('schedules[0].schedule_information')
.push({ subject: 1})
.write()

db.get('schedules[1].schedule_information')
.push({ subject: 2, course_id: 27})
.write()

db.get('schedules[1].schedule_information')
.push({ subject: 3, course_id: 30})
.write()



var subject_array = [];
var info_array = [];
 
// Delete duplicates in array for unique subjects
function removeDuplicates(array) {
    return array.filter((a, b) => array.indexOf(a) === b)
};

// Get drop down list and send it to browser

app.get('/api/dropdown', (req, res) => {

    for (i = 0; i < data_count; i++) {
        subject_array[i] = data[i].subject; 
    }

    subject_array = removeDuplicates(subject_array);

    res.send(subject_array);
});

// Main page form submit to search for courses
app.get('/api/courses', (req, res) => {
  curr_data = req.query;
  info_array = [];  
  subject_name = curr_data.subject;
  number = curr_data.course_number;
  component = curr_data.course_cmpnt;

  if (subject_name == "All_Subjects" && number == "") { // done
    return res.status(400).send({
        message: 'Too many results to display. Please narrow search fields.'
    });      
  }

  else if (subject_name != "All_Subjects" && number == "" && component != "all_components") { // Subject area chosen and specific component chosen

    for (i = 0; i < data.length; i++) {
        if (subject_name == data[i].subject && component == data[i].course_info[0].ssr_component) {
            info_array.push(data[i]);            
        }
    }

    if (info_array.length == 0) {
        return res.status(404).send({
            message: 'Not Found'
        }); 
    } else {
        res.send(info_array);
        return true;
    }    
  }

  else if (subject_name != "All_Subjects" && number == "" && component == "all_components") { // Subject area chosen and any component chosen
    
    for (i = 0; i < data.length; i++) {
        if (subject_name == data[i].subject) {
            info_array.push(data[i]);            
        }
    } 
    if (info_array.length == 0) {
        return res.status(404).send({
            message: 'Not Found'
        });  
    } else {
        res.send(info_array);
        return true;
    }
  }
  
  else if ((subject_name != "All_Subjects" && number != "" && component == "all_components")) { // If course code area is filled out
    for (i = 0; i < data.length; i++) {
        if (subject_name == data[i].subject && number == data[i].catalog_nbr) {
            info_array.push(data[i]);            
        }
    } 
    if (info_array.length == 0) {
        return res.status(404).send({
            message: 'Not Found'
        });  
    } else {
        res.send(info_array);
        return true;
    }
  } 

  else if ((subject_name == "All_Subjects" && number != "" && component == "all_components")) { // If course code area is filled out
    for (i = 0; i < data.length; i++) {
        if (number == data[i].catalog_nbr) {
            info_array.push(data[i]);            
        }
    } 
    if (info_array.length == 0) {
        return res.status(404).send({
            message: 'Not Found'
        });  
    } else {
        res.send(info_array);
        return true;
    }
  }    
});

app.listen(3000, () => console.log('Listening on port 3000'));