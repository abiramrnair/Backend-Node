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

    if (db.get('schedules').find({schedule_id: curr_data.name}).value()) {
        return res.status(400).send({
            message: "Status 400, Something Went Wrong"
        });
    } else {

    db.get('schedules')
    .push({ schedule_id: curr_data.name, schedule_information: []})
    .write()

    return res.status(200).send({
        message: "Status 200 OK, schedule added"
    });
}
});

app.get('/api/schedules/check', (req, res) => {
    const curr_data = req.query;
    const sched_name = curr_data.schedule;
    const crs_name = curr_data.course_name;
    sched_array = db.get('schedules').map('schedule_id').value();
    
    for (i = 0; i < sched_array.length; i++) {
        if (sched_array[i] == sched_name) {
            var ref_num = i;            
        }
    }

   course_array = db.get('schedules[' + ref_num + '].schedule_information').map().value();   
   
   for (i = 0; i < course_array.length; i++) {
       if (course_array[i].course_id == crs_name) {
        return res.status(200).send({
            message: "Exists"
        });        
        }  
    } 

    return res.status(200).send({
        message: "Course does not exist"
    });   
});

app.post('/api/schedules/addcourse', (req, res) => {
    const curr_data = req.query;
    const sched_name = curr_data.schedule;
    const course_name = curr_data.course_name;
    const sbj_code = curr_data.subject_code;    
    const crs_code = curr_data.course_code;

    sched_array = db.get('schedules').map('schedule_id').value();
    
    for (i = 0; i < sched_array.length; i++) {
        if (sched_array[i] == sched_name) {
            var ref_num = i; 
            db.get('schedules[' + ref_num + '].schedule_information').push({course_id: course_name, subject_code: sbj_code, course_code: crs_code}).write(); 
            res.send("Course Added");
            return true;          
        }
    }

    res.send("Error adding course");
});

app.get('/api/schedules/dropdown', (req, res) => {
    let name_array = [];
    name_array = db.get('schedules').map('schedule_id').value();  
    res.send(name_array);
});

app.delete('/api/schedules/delete', (req, res) => {
    curr_data = req.query;

    if (curr_data.schedule == "all_schedules") {
        return res.status(404).send({
            message: "Status 404, Schedule Not Found"
        });
    }

    db.get('schedules')
    .remove({schedule_id: curr_data.schedule})
    .write()

    if (db.has('schedule_id: curr_data.schedule').value()) {
        return res.status(400).send({
            message: "Status 400, Something Went Wrong"
        });
    } else {
        return res.status(200).send({
            message: "Status 200 OK, Schedule Item Deleted"
        });
    }
})

app.delete('/api/schedules/delete_all', (req, res) => {

    db.get('schedules').remove({}).write();

    if (db.get('schedules').size().value() == 0) {
        return res.status(200).send({
            message: "Status 200 Request Succeeded, All Schedules Deleted"
        }); 
    } else {
        return res.status(400).send({
            message: "Status 400, Something Went Wrong"
        });
    }
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
        message: "Too many results to display. Please narrow search fields."
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
            message: "Not Found"
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
            message: "Not Found"
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
            message: "Not Found"
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
            message: "Not Found"
        });  
    } else {
        res.send(info_array);
        return true;
    }
  }    
});

app.listen(3000, () => console.log('Listening on port 3000'));