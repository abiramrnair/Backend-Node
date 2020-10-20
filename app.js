const express = require('express');
const app = express();
const path = require('path');
const data = require("./Lab3-timetable-data.json");
const data_count = Object.keys(data).length;

var subject_array = [];
var info_array = [];

// Make an array of all subjects for drop down menu
for (i = 0; i < data_count; i++) {
    subject_array[i] = data[i].subject; 
}

// Delete duplicates in array for unique subjects
function removeDuplicates(array) {
    return array.filter((a, b) => array.indexOf(a) === b)
};

subject_array = removeDuplicates(subject_array);

//console.log(subject_array); *USED THIS TO COPY TO ARRAY AND CREATE A ONE TIME UPDATE DROP DOWN LIST OF ITEMS FOR BROWSERSIDE JAVASCRIPT DOM MANIPULATION*
var curr_data = [];

app.use(express.static('Public'));

// Main page form submit to search for courses
app.get('/api/courses', (req, res) => {
  curr_data = req.query;
  info_array = [];  
  subject_name = curr_data.subject;
  number = curr_data.course_number;
  component = curr_data.course_cmpnt;

  if (subject_name == "All_Subjects" && number == "") { // done
      res.send("Too many results to display. Please narrow search fields.");
      return false;
  }

  else if (subject_name != "All_Subjects" && number == "" && component != "all_components") { // Subject area chosen and specific component chosen

    for (i = 0; i < data.length; i++) {
        if (subject_name == data[i].subject && component == data[i].course_info[0].ssr_component) {
            info_array.push(data[i]);            
        }
    }

    if (info_array.length == 0) {
        res.sendStatus(404);  
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
        res.sendStatus(404);  
    } else {
        res.send(info_array);
        return true;
    }
  }

  else if ((subject_name == "All_Subjects" || subject_name != "All_Subjects") && number != "" && component == "all_components") {
    for (i = 0; i < data.length; i++) {
        if (number == data[i].catalog_nbr) {
            info_array.push(data[i]);            
        }
    } 
    if (info_array.length == 0) {
        res.sendStatus(404);  
    } else {
        res.send(info_array);
        return true;
    }
  }    
});






app.listen(3000, () => console.log('Listening on port 3000'));