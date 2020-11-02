var box = document.getElementById("searchbox");
box.style.opacity = "0";

async function getDropDown() {
    const response = await fetch("/api/schedules/dropdown");   
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

async function displayScheduleItems() {
    var box = document.getElementById("searchbox");
    box.style.opacity = "1";
    box.style.backgroundColor = "white";
    var schedule = document.getElementById("all_schedules").value;
    var link = "/api/schedules/load/" + schedule;

    document.getElementById("delete_schedule_button").disabled = true;
    document.getElementById("delete_all_schedule_button").disabled = true;
    document.getElementById("schedule_button").disabled = true;
    var button = document.getElementById("load_schedule_button");   
    button.value = "Load Another Schedule";
    document.getElementById("load_schedule_button").setAttribute('onclick','goHome()');

    const response = await fetch(link);
    const data = await response.json();

    if (data.message == "No Courses") {
        var h = document.createElement("H2");
        var text = document.createTextNode("There Are No Courses Added To This Draft, Go To Build Schedule To Get Started");
        h.appendChild(text);
        box.appendChild(h);
    } else {

    var h = document.createElement("H2");
    h.style.paddingBottom = "20px";
    h.style.fontStyle = "italic";
    var text = document.createTextNode("Displaying " + data.length + " Saved Courses In Draft " + '"' + schedule + '"');
    h.appendChild(text);
    box.appendChild(h);
    
    for (i = 0; i < data.length; i++) {        
        let crsname = document.createElement("ul");  
        crsname.textContent = (i+1) + ". " + data[i].course_name;     
        let subject_name = document.createElement("li");
        var text = document.createTextNode("Subject Code: " + data[i].subject_code);
        subject_name.appendChild(text);
        var text = document.createTextNode("Course Code: " + data[i].course_code);
        let course_code = document.createElement("li");
        course_code.appendChild(text);
        crsname.appendChild(subject_name);
        crsname.appendChild(course_code);
        box.appendChild(crsname);
    }
    }

}

async function deleteSingleSchedule() {    
    var box = document.getElementById("searchbox");
    box.style.opacity = "1";
    box.style.backgroundColor = "white";
    var item = document.getElementById("all_schedules").value;
    var link = "/api/schedules/delete?" + "schedule=" + item;
    const response = await fetch(link, {method: 'delete'});   
    const data = await response.json();

    if (data.message == "Status 200 OK, Schedule Item Deleted") {
        var h = document.createElement("H2");
        var text = document.createTextNode("The Schedule Has Been Deleted, Please Refresh to View Changes");
        h.appendChild(text);
        box.appendChild(h);
    }
    
    else if (data.message == "Status 404, Schedule Not Found") {
        var h = document.createElement("H2");
        var text = document.createTextNode("Please make a schedule first or choose a valid schedule item");
        h.appendChild(text);
        box.appendChild(h);
    }
    else {
        var h = document.createElement("H2");
        var text = document.createTextNode("Status 400, Something Went Wrong");
        h.appendChild(text);
        box.appendChild(h);
    }
}


async function deleteAllSchedules() {
    var box = document.getElementById("searchbox");
    box.style.opacity = "1";
    box.style.backgroundColor = "white";
    const response = await fetch("/api/schedules/delete_all", {method: 'delete'});   
    const data = await response.json();

    if (data.message == "Status 200 Request Succeeded, All Schedules Deleted") {
        var h = document.createElement("H2");
        var text = document.createTextNode("All Schedules Deleted, Please Refresh to View Changes");
        h.appendChild(text);
        box.appendChild(h);
    } else {
        var h = document.createElement("H2");
        var text = document.createTextNode("Status 400, Something Went Wrong");
        h.appendChild(text);
        box.appendChild(h);
    }

    document.getElementById("delete_schedule_button").disabled = true;
    document.getElementById("delete_all_schedule_button").disabled = true;
    document.getElementById("schedule_button").disabled = true;
}

function goHome() {
    window.location.href = "manage_schedule.html";
    getDropDown();
}

async function createSchedule() {
    var box = document.getElementById("searchbox");
    box.style.opacity = "1";
    box.style.backgroundColor = "white";
    var name = document.getElementById("schedule_name").value;
    var link = "/api/schedules/createschedule?" + "name=" + name;

    const response = await fetch(link, {method: 'put'}); // Specify that this is a POST request (default is GET)
    const data = await response.json();

    if (data.message == "Status 200 OK, schedule added") {
        var h = document.createElement("H2");
        var text = document.createTextNode("Schedule Added!");
        h.appendChild(text);
        box.appendChild(h);
        var button = document.getElementById("schedule_button");   
        button.value = "Create Another Schedule";
        document.getElementById("schedule_button").setAttribute('onclick','goHome()');
    } 
    
    else if (data.message == "Schedule Name Is Invalid") {
        var h = document.createElement("H2");
        var text = document.createTextNode("Schedule Name Is Invalid");
        h.appendChild(text);
        box.appendChild(h);
        var button = document.getElementById("schedule_button");   
        button.value = "Create Another Schedule";
        document.getElementById("schedule_button").setAttribute('onclick','goHome()');
    }

    else {
        var h = document.createElement("H2");
        var text = document.createTextNode("Schedule Name Already Exists!");
        h.appendChild(text);
        box.appendChild(h);
        var button = document.getElementById("schedule_button");   
        button.value = "Create Another Schedule";
        document.getElementById("schedule_button").setAttribute('onclick','goHome()');
    }
}