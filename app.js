const express = require('express');
const app = express();
const data = require("./Lab3-timetable-data.json");
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('schedule_database.json');
const db = low(adapter);
const Joi = require('joi');
const { number } = require('joi');

app.use(express.static('Public'));

// Database defaults
db.defaults({schedules: []}).write()

// JOI function for validating inputs for reuse in API
function validateSchedule(schedule) {
    const schema = Joi.object({
        name: Joi.string().min(1).required() // Schedule name cannot be blank space or have any URL confusing characters
    });
    return schema.validate({ name: schedule});
}

function validateCourseCode(coursecode) {
    const schema = Joi.object({
        number: Joi.string().max(5).uppercase().required() // Can either be a four digit number 1234 or a five character string 1234A
    });
    return schema.validate({ number: coursecode});
}

app.put('/api/schedules/createschedule', (req, res) => {
    curr_data = req.query;
    const result = validateSchedule(curr_data.name);   
    
    if (result.error) {
        return res.status(400).send({
            message: "Schedule Name Is Invalid"
        });
    }

    if (db.get('schedules').find({schedule_id: curr_data.name}).value()) { // If schedule name already exists
        return res.status(400).send({
            message: "Status 400, Something Went Wrong"
        });
    } else {

    db.get('schedules').push({ schedule_id: curr_data.name, schedule_information: []}).write()

    return res.status(200).send({
        message: "Status 200 OK, schedule added"
    });
}
});

app.get('/api/schedules/load/:schedule_id', (req, res) => {
    const data = req.params.schedule_id;
    const sched_array = db.get('schedules').map('schedule_id').value();
    
    for (i = 0; i < sched_array.length; i++) {
        if (sched_array[i] == data) {
            var ref_num = i;            
        }
    }

    const sched_list = db.get('schedules[' + ref_num + '].schedule_information').map().value();

    if (sched_list.length > 0) {
        return res.status(200).send(
            sched_list            
        );        
    }
    else {
        return res.status(200).send({
            message: "No Courses"
        });
    }
});

app.get('/api/schedules/check', (req, res) => {
    const curr_data = req.query;
    const sched_name = curr_data.schedule;
    const crs_code = curr_data.course_code;
    sched_array = db.get('schedules').map('schedule_id').value();
    
    for (i = 0; i < sched_array.length; i++) {
        if (sched_array[i] == sched_name) {
            var ref_num = i;            
        }
    }

   course_array = db.get('schedules[' + ref_num + '].schedule_information').map().value();   
   
   for (i = 0; i < course_array.length; i++) {
       if (course_array[i].course_code == crs_code) {
        return res.status(200).send({
            message: "Exists"
        });        
        }  
    } 

    return res.status(200).send({
        message: "Course does not exist"
    });   
});

app.put('/api/schedules/addcourse', (req, res) => {
    const curr_data = req.query;
    const sched_name = curr_data.schedule;
    const course_name = curr_data.course_name;
    const sbj_code = curr_data.subject_code;    
    const crs_code = curr_data.course_code;

    sched_array = db.get('schedules').map('schedule_id').value();
    
    for (i = 0; i < sched_array.length; i++) {
        if (sched_array[i] == sched_name) {
            var ref_num = i; 
            db.get('schedules[' + ref_num + '].schedule_information').push({course_name: course_name, subject_code: sbj_code, course_code: crs_code}).write(); 
            return res.status(200).send({
                message: "Course Added"
            });          
        }
    }

    return res.status(400).send({
        message: "Error Adding Course"
    });
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

    for (i = 0; i < data.length; i++) {
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
  num = curr_data.course_number;
  component = curr_data.course_cmpnt;

  if (subject_name == "All_Subjects" && num == "") { // done
    return res.status(400).send({
        message: "Too many results to display. Please narrow search fields."
    });      
  }

  else if (subject_name != "All_Subjects" && num == "" && component != "all_components") { // Subject area chosen and specific component chosen

    for (i = 0; i < data.length; i++) {
        if (subject_name == data[i].subject && component == data[i].course_info[0].ssr_component) {
            info_array.push(data[i]);            
        }
    }

    if (info_array.length == 0) {
        return res.status(404).send({
            message: "Course Not Found"
        }); 
    } else {
        res.send(info_array);
        return true;
    }    
  }

  else if (subject_name != "All_Subjects" && num == "" && component == "all_components") { // Subject area chosen and any component chosen
    
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
  
  else if ((subject_name != "All_Subjects" && num != "" && component == "all_components")) { // If course code, subject name and component are all filled out

    const result = validateCourseCode(num);

    for (i = 0; i < data.length; i++) {
        if (subject_name == data[i].subject && num == data[i].catalog_nbr) {
            info_array.push(data[i]);            
        }
    } 
    if (info_array.length == 0 || result.error) {
        return res.status(404).send({
            message: "Not Found"
        });  
    } else {
        res.send(info_array);
        return true;
    }
  }

  else if (subject_name == "All_Subjects" && num != "" && component != "all_components") { // If course code, subject name and component are all filled out but incorrect

    const result = validateCourseCode(num);

    for (i = 0; i < data.length; i++) {
        if (subject_name == data[i].subject && num == data[i].catalog_nbr && component == data[i].course_info[0].ssr_component) {
            info_array.push(data[i]);            
        }
    } 
    if (info_array.length == 0 || result.error) {
        return res.status(404).send({
            message: "Course Not Found"
        });  
    } else {
        res.send(info_array);
        return true;
    }
  }

  else if (subject_name != "All_Subjects" && num != "" && component != "all_components") { // If course code, subject name and component are all filled out but incorrect

    const result = validateCourseCode(num);

    for (i = 0; i < data.length; i++) {
        if (subject_name == data[i].subject && num == data[i].catalog_nbr && component == data[i].course_info[0].ssr_component) {
            info_array.push(data[i]);            
        }
    } 
    if (info_array.length == 0 || result.error) {
        return res.status(404).send({
            message: "Course Not Found"
        });  
    } else {
        res.send(info_array);
        return true;
    }
  } 

  else if ((subject_name == "All_Subjects" && num != "" && component == "all_components")) { // If only course code area is filled out

    const result = validateCourseCode(num);

    for (i = 0; i < data.length; i++) {
        if (num == data[i].catalog_nbr) {
            info_array.push(data[i]);            
        }
    } 
    if (info_array.length == 0 || result.error) {
        return res.status(404).send({
            message: "Not Found"
        });  
    } else {
        res.send(info_array);
        return true;
    }
  }    
});

// Use port 3000 unless preconfigured port exists
var port = process.env.port || 3000
app.listen(port, () => console.log('Server Is Now Running'));