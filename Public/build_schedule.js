var box = document.getElementById("searchbox");
box.style.opacity = "0";

async function getDropDown() {
    const response = await fetch("http://localhost:3000/api/schedules/dropdown");   
    const data = await response.json();
    createDropDownList(data);
}

function createDropDownList(subjectlist) {
    var selectbox = document.getElementById("all_schedules");

    for (i = 0; i < subjectlist.length; i++) {
    var newOption = document.createElement('option');
    var optionText = document.createTextNode(subjectlist[i]);
    newOption.appendChild(optionText);
    selectbox.appendChild(newOption);
    }
}

getDropDown();

function goHome() {
    window.location.href = "build_schedule.html";
}

async function getSubjectDropDown() {
    const response = await fetch("http://localhost:3000/api/dropdown");   
    const data = await response.json();
    createSubjectDropDownList(data);
}

function createSubjectDropDownList(subjectlist) {
    var selectbox = document.getElementById("select_subject");

    for (i = 0; i < subjectlist.length; i++) {
    var newOption = document.createElement('option');
    var optionText = document.createTextNode(subjectlist[i]);
    newOption.appendChild(optionText);
    selectbox.appendChild(newOption);
    }
}

getSubjectDropDown();

async function listCourses() {    
    var box = document.getElementById("searchbox");
    box.style.opacity = "1";
    box.style.backgroundColor = "white";
    var subject = document.getElementById("select_subject").value;
    var coursenumber = document.getElementById("course_nbr").value;
    var component = document.getElementById("components").value;
    var schd = document.getElementById("all_schedules").value;

    var link = "http://localhost:3000/api/courses?" + "subject=" + subject + "&course_number=" + coursenumber + "&course_cmpnt=" + component;
    console.log(link);
    document.getElementById("select_subject").disabled = true;
    document.getElementById("course_nbr").disabled = true;
    document.getElementById("components").disabled = true;
    document.getElementById("all_schedules").disabled = true;
    
    const response = await fetch(link);
    const data = await response.json(); 
    

    if (data.message == "Not Found") {
        var h = document.createElement("H2");
        var text = document.createTextNode("Error 404, Course not Found!");
        h.appendChild(text);
        box.appendChild(h);
        var button = document.getElementById("submitbutton");   
        button.value = "Click here to search again";
        document.getElementById("submitbutton").setAttribute('onclick','goHome()');
    } 

    else if (data.message == "Too many results to display. Please narrow search fields.") {
        var h = document.createElement("H2");
        var text = document.createTextNode("Too many results to display. Please narrow search fields.");
        h.appendChild(text);
        box.appendChild(h);
        var button = document.getElementById("submitbutton");   
        button.value = "Click here to search again";
        document.getElementById("submitbutton").setAttribute('onclick','goHome()');
    }   

    else if (document.getElementById("all_schedules").value == "all_schedules") {
        var h = document.createElement("H2");
        var text = document.createTextNode("Please Choose a Schedule or Create One By Going to Manage Schedules");
        h.appendChild(text);
        box.appendChild(h);
        var button = document.getElementById("submitbutton");   
        button.value = "Click here to search again";
        document.getElementById("submitbutton").setAttribute('onclick','goHome()');
    }
    
    else {

        var h = document.createElement("H2");
        h.style.paddingBottom = "20px";
        h.style.fontStyle = "italic";
        var text = document.createTextNode("Displaying " + data.length + " Search Results");
        h.appendChild(text);
        box.appendChild(h);

    for (i = 0; i < data.length; i++) {
        
        var h = document.createElement("H3");
        var text = document.createTextNode(data[i].subject + " " + data[i].catalog_nbr + " - " + data[i].className);
        h.appendChild(text);
        box.appendChild(h);

        var para = document.createElement("P");
        var text = document.createTextNode(data[i].catalog_description);
        para.appendChild(text);
        box.appendChild(para);
        
        var table = document.createElement("table");        
        var header = table.createTHead();     
        
        var row = header.insertRow(0); // Row One
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        var cell5 = row.insertCell(4);
        var cell6 = row.insertCell(5);
        var cell7 = row.insertCell(6);
        var cell8 = row.insertCell(7);
        var cell9 = row.insertCell(8);
        var cell10 = row.insertCell(9);
        

        var text = document.createTextNode("Section");
        cell1.appendChild(text);
        var text = document.createTextNode("Component");
        cell2.appendChild(text);
        var text = document.createTextNode("Class Number");
        cell3.appendChild(text);
        var text = document.createTextNode("Days");
        cell4.appendChild(text);
        var text = document.createTextNode("Start Time");
        cell5.appendChild(text);
        var text = document.createTextNode("End Time");
        cell6.appendChild(text);
        var text = document.createTextNode("Campus");
        cell7.appendChild(text);
        var text = document.createTextNode("Instructor");
        cell8.appendChild(text);
        var text = document.createTextNode("Status");
        cell9.appendChild(text);
        var text = document.createTextNode("Action");
        cell10.appendChild(text);     
        

        var row = table.insertRow(1); // Row Two
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);        
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        var cell5 = row.insertCell(4);
        var cell6 = row.insertCell(5);
        var cell7 = row.insertCell(6);
        var cell8 = row.insertCell(7);
        var cell9 = row.insertCell(8);
        var cell10 = row.insertCell(9);

        var text = document.createTextNode(data[i].course_info[0].class_section);
        cell1.appendChild(text);
        var text = document.createTextNode(data[i].course_info[0].ssr_component);
        cell2.appendChild(text);
        cell2.id = data[i].course_info[0].ssr_component;           
        var text = document.createTextNode(data[i].course_info[0].class_nbr);
        cell3.appendChild(text);
        var text = document.createTextNode(data[i].course_info[0].days);
        cell4.appendChild(text);
        var text = document.createTextNode(data[i].course_info[0].start_time);
        cell5.appendChild(text);
        var text = document.createTextNode(data[i].course_info[0].end_time);
        cell6.appendChild(text);
        var text = document.createTextNode(data[i].course_info[0].campus);
        cell7.appendChild(text);
        var text = document.createTextNode(data[i].course_info[0].instructors);
        cell8.appendChild(text);
        var text = document.createTextNode(data[i].course_info[0].enrl_stat);
        cell9.appendChild(text);

        if (await doesCourseExist(data[i].catalog_nbr) == false) { // Course does not exist on schedule
            var text = document.createTextNode("Add Course"); 
            var btn = document.createElement("button");
            btn.className = "add_course_btn";
            btn.id = data[i].catalog_nbr;
            let clsname = data[i].className;
            let sbjct = data[i].subject;
            let crsnbr = data[i].catalog_nbr;            
            btn.addEventListener('click', function() {
                createScheduleEntry(clsname, sbjct, crsnbr);
                document.getElementById(crsnbr).textContent = "Course Added";
                document.getElementById(crsnbr).disabled = 'true';
            });
            btn.appendChild(text);
            cell10.appendChild(btn);
        } else if (await doesCourseExist(data[i].catalog_nbr) == true) { // Course exists on schedule
            var text = document.createTextNode("Course Added"); 
            cell10.appendChild(text);
        }        
        box.appendChild(table);
    }

    var button = document.getElementById("submitbutton");   
    button.value = "Click here to search again";
    document.getElementById("submitbutton").setAttribute('onclick','goHome()');
}
}

async function doesCourseExist(coursenbr) { // This helps determine whether a button should be created or not to add
    var schedule_name = document.getElementById("all_schedules").value;
    
    let link = "http://localhost:3000/api/schedules/check?" + "schedule=" + schedule_name + "&course_code=" + coursenbr;

    const response = await fetch(link);
    const data = await response.json();       

    if (data.message == "Exists") {
        return true;
    } else {
        return false;
    }    
}

async function createScheduleEntry(coursename, subjectcode, coursecode) { // clicking the button does this function to add entry to chosen schedule
    var schedule_name = document.getElementById("all_schedules").value;

    let link = "http://localhost:3000/api/schedules/addcourse?" + "schedule=" + schedule_name + "&course_name=" + coursename.replace(/[&#,+()$~%.'":*?<>{}]/g, "AND") + "&subject_code=" + subjectcode + "&course_code=" + coursecode;

    // There was a problem where course names with special characters were confusing the URL, so I used a filter function to replace & but not / with "AND" ^^
    const response = await fetch(link, {method: 'post'});
    const data = await response.json();

    if (data.message == "Course Added") {
        return true;
    } else {
        return false;
    } 
}

