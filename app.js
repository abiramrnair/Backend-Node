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


app.post('/api/schedules/createschedule', (req, res) => {
    curr_data = req.query;

    db.get('schedules')
    .push({ schedule_id: curr_data.name, schedule_information: []})
    .write()

    return res.status(200).send({
        message: "Status 200 OK, schedule added"
    }); 
});

app.get('/api/schedules/dropdown', (req, res) => {
    let name_array = [];
    name_array = db.get('schedules').map('schedule_id').value();  
    res.send(name_array);
});


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