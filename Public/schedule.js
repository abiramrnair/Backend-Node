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

async function deleteSingleSchedule() {    
    var box = document.getElementById("searchbox");
    box.style.opacity = "1";
    box.style.backgroundColor = "white";
    var item = document.getElementById("all_schedules").value;
    var link = "http://localhost:3000/api/schedules/delete?" + "schedule=" + item;
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
    const response = await fetch("http://localhost:3000/api/schedules/delete_all", {method: 'delete'});   
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
    var link = "http://localhost:3000/api/schedules/createschedule?" + "name=" + name;

    const response = await fetch(link, {method: 'post'}); // Specify that this is a POST request (default is GET)
    const data = await response.json();

    if (data.message == "Status 200 OK, schedule added") {
        var h = document.createElement("H2");
        var text = document.createTextNode("Schedule Added!");
        h.appendChild(text);
        box.appendChild(h);
        var button = document.getElementById("schedule_button");   
        button.value = "Create Another Schedule";
        document.getElementById("schedule_button").setAttribute('onclick','goHome()');
    } else {
        var h = document.createElement("H2");
        var text = document.createTextNode("Schedule Name Already Exists!");
        h.appendChild(text);
        box.appendChild(h);
        var button = document.getElementById("schedule_button");   
        button.value = "Create Another Schedule";
        document.getElementById("schedule_button").setAttribute('onclick','goHome()');
    }
}