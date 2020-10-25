var box = document.getElementById("searchbox");
box.style.opacity = "0";

async function getDropDown() {
    const response = await fetch("http://localhost:3000/api/dropdown");   
    const data = await response.json();
    createDropDownList(data);
}

function createDropDownList(subjectlist) {
    var selectbox = document.getElementById("select_subject");

    for (i = 0; i < subjectlist.length; i++) {
    var newOption = document.createElement('option');
    var optionText = document.createTextNode(subjectlist[i]);
    newOption.appendChild(optionText);
    selectbox.appendChild(newOption);
    }
}

getDropDown();

function goHome() {
    window.location.href = "index.html";
}

async function listCourses() {    
    var box = document.getElementById("searchbox");
    box.style.opacity = "1";
    box.style.backgroundColor = "white";
    var subject = document.getElementById("select_subject").value;
    var coursenumber = document.getElementById("course_nbr").value;
    var component = document.getElementById("components").value;
    var link = "http://localhost:3000/api/courses?" + "subject=" + subject + "&course_number=" + coursenumber + "&course_cmpnt=" + component;
    
    document.getElementById("select_subject").disabled = true;
    document.getElementById("course_nbr").disabled = true;
    document.getElementById("components").disabled = true;
    
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

    else {

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
        

        var row = table.insertRow(1);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);        
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        var cell5 = row.insertCell(4);
        var cell6 = row.insertCell(5);
        var cell7 = row.insertCell(6);
        var cell8 = row.insertCell(7);
        var cell9 = row.insertCell(8);

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
        box.appendChild(table);
    }

    var button = document.getElementById("submitbutton");   
    button.value = "Click here to search again";
    document.getElementById("submitbutton").setAttribute('onclick','goHome()');
}
}

