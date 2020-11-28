const express = require('express');
const app = express();
const data = require("./Lab3-timetable-data.json");
const bcrypt = require('bcrypt'); // Password hashing
const crypto = require('crypto'); // Random review ID
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('schedule_database.json');
const user_database = new FileSync('user_database.json');
const token_database = new FileSync('token_database.json');
const review_database = new FileSync('review_database.json');

const db = low(adapter);
const user_db = low(user_database);
const token_db = low(token_database);
const review_db = low(review_database);

// Database defaults
db.defaults({schedules: []}).write() // schedules
user_db.defaults({users: [], links: []}).write(); // all users including admin
token_db.defaults({tokens: []}).write(); // all refresh tokens stored
review_db.defaults({reviews: []}).write(); // all course reviews are stored

const ACCESS_TOKEN_SECRET = '9b653f80ba4d1ed94c1e3d4ea701e2da627e72c551bd91586f203ac1b18638402926418d2b4610cd93494fa4348d04692cc0bccb0ce5d1f47367f220c8369721';
const REFRESH_TOKEN_SECRET = 'e34369e97dc3a873e73078fc788da4bdf0b725713911721ba9415f44997a67016ac550e0fc7c4bc6215028f7e6425ec3b8ea30fc66c4abb0447d98b836b8edae';
const ADMIN_TOKEN_SECRET = 'drsuwQhU3nwozzfFswLKp416hZmvhGE2XX4SmyK3YqjAIsmiL67Phe6PPIsT1JUPwr6BD2dbfG7CFuNWIZsZVabJ5mJue7LAE2VztlRmzdmOIrkNR9Hk1EahgOU4VR7YF3';

const Joi = require('joi');
const { number } = require('joi');
const cors = require('cors');

app.use(express.static('Public'));
app.use(express.json()); 

// Enable CORS
app.use(cors())

app.use(bodyParser.json())

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id");
    res.header('Access-Control-Expose-Headers','x-access-token, x-refresh-token');
    next();
});

// JOI function for validating inputs for reuse in API
function validateSchedule(schedule) {
    const specialChar = /^[^<>:/?#@!$&'()*+,;=]*$/;
    const schema = Joi.object({
        name: Joi.string().min(1).regex(specialChar).required() // Schedule name cannot be blank space or have any URL confusing characters
    });
    return schema.validate({ name: schedule});
}

function validateCourseCode(coursecode) {
    const specialChar = /^[^<>:/?#@!$&'()*+,;=]*$/;
    const schema = Joi.object({
        number: Joi.string().max(5).uppercase().regex(specialChar).required() // Can either be a four digit number 1234 or a five character string 1234A
    });
    return schema.validate({ number: coursecode});
}

function validateEmail(email) {
    //const specialChar = /^[^<>:/?#@!$&'()*+,;=]*$/;
    const schema = Joi.string().email();
    return schema.validate(email);
}

// Login methods

// Register Method
app.post('/api/public/register', async (req, res) => { // generates a user link as well after registering
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    if (!username || !email || !password) {
        return res.send({ message: "Enter All Text Fields" });
    }

    const result = validateEmail(email);

    if (result.error) {
        return res.send({ message: "Invalid Email" });
    }

    let doesExist = user_db.get('users').map({ email: email }).value();

    if (doesExist == "true") {
        return res.send({ message: "Exists" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10) // 10 is a good amount of rounds   
        const hashedEmail = await bcrypt.hash(email, 10) // once again 10     
        user_db.get('users').push({ username: username, email: email, password: hashedPassword, role: 'User', status: 'Inactive' }).write(); // All users are inactive by default unless click on verification or admin changes
        user_db.get('links').push({ link: hashedEmail }).write();
        return res.status(201).send({
            message: "Account Created",
            link: hashedEmail
        });
    } catch {
        return res.status(500).send({
            message: "Account Could Not Be Created"
        });
    }    
})

app.post('/api/user/verify', async (req, res) => { // used to verify the link that the user clicks after registering
    const hashedCode = req.body.hashed_code;
    const email = req.body.email;

    let doesExist = user_db.get('links').map({ link: hashedCode }).value();
    let ref;

    if (doesExist == "true") {
        
        if (await bcrypt.compare(email, hashedCode)) {
            
            let user_array = user_db.get('users').value();

            for (i = 0; i < user_array.length; i++) {
                if (user_db.get('users[' + i + '].email').value() == email) {
                    ref = i;
                }
            }
            
            user_db.get('users[' + ref + ']').set('status', 'Active').write();
            user_db.get('links').remove({ link: hashedCode }).write();

            return res.status(200).send({
                message : "Successfully Verified"
            });
        }

        else {
            return res.status(404).send({
                message : "Invalid Email"
            }); 
        }
    }

    else {
        return res.status(404).send({
            message : "Invalid Link Used"
        });
    }
})

// Login Method
app.post('/api/public/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;   

    if (!email || !password) {
        return res.send({ message: "Fill Out All Input Fields" });        
    }

    const result = validateEmail(email);

    if (result.error) {
        return res.send({ message: "Invalid Email" }); 
    }

    const admin_email = "admin@3316Lab5.com";
    const admin_password = "3316Lab5";

    if (email == admin_email && password == admin_password) {
        
        let user = {
            email,
            password,
            username: "Administrator"
        };

        try {
            const adminAccessToken = generateAdminAccessToken(user); // Login successful, so make admin access token
            const adminRefreshToken = jwt.sign(user, ADMIN_TOKEN_SECRET); // Refresh token to make new admin tokens
            token_db.get('tokens').push( { adminRefreshToken: adminRefreshToken }).write();
            return res.send({
                accessToken: adminAccessToken,
                refreshToken: adminRefreshToken,
                username: user.username
            })
        }   catch {
                return res.status(500).send({
                message: "Unable to login"
            })
        }       
    }
    
    const user = user_db.get('users').find({ email: email }).value();
    
    if (user == null) {
        return res.status(400).send({
            message: "Email not found"
        })
    }

    else if (user.status == "Inactive") {
        return res.send({ message: "Account Inactive, Contact Administrator" });
    } 

    try {        
        if (await bcrypt.compare(password, user.password)) {            
            const accessToken = generateAccessToken(user); // Login successful, so make access token
            const refreshToken = jwt.sign(user, REFRESH_TOKEN_SECRET); // Refresh token to make new access tokens     
            token_db.get('tokens').push({ refreshToken: refreshToken}).write(); // Insert refresh token into persistent database     
            res.send( {
                accessToken: accessToken,
                refreshToken: refreshToken,
                username: user.username
            })
        } else {
            return res.status(400).send({
                message: "Wrong Password"
            })
        }
    } catch {
        return res.status(500).send({
            message: "Unable to login"
        })
    }
})

function generateAccessToken(user) {
    return jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: '60m'})
}

function generateAdminAccessToken(user) {
    return jwt.sign(user, ADMIN_TOKEN_SECRET, { expiresIn: '60m'})
}

let authenticateToken = (req, res, next) => { // verify API calls
    let token = req.header('x-access-token');

    if (token == null) {
        return res.sendStatus(401)
    }

    jwt.verify(token, ACCESS_TOKEN_SECRET, (error, user) => {
        if (error) {
            return res.sendStatus(403);
        } 
        req.username = user.username;
        next();
    })    
}

let authenticateAdminToken = (req, res, next) => {
    let token = req.header('x-access-token');

    if (token == null) {
        return res.sendStatus(401)
    }

    jwt.verify(token, ADMIN_TOKEN_SECRET, (error, user) => {
        if (error) {
            return res.sendStatus(403);
        } 
        req.username = user.username;
        next();
    })
}

// ADMIN Routes

app.get('/api/admin/getusers', authenticateAdminToken, (req, res) => { // Get a list of all users on the website
    const admin = req.username;

    if (!admin) {
        return res.sendStatus(403);
    }

    let user_array = user_db.get('users').value();
    return res.send(user_array);
})

app.put('/api/admin/users/switchadmin', authenticateAdminToken, (req, res) => { // Make another user an admin or take away admin priveleges
    const admin = req.username;

    if (!admin) {
        return res.sendStatus(403);
    }

    const email = req.body.email;
    let user_array = user_db.get('users').value();
    let ref;

    for (i = 0; i < user_array.length; i++) {
        if (user_array[i].email == email) {
            ref = i;
        }
    }

    let role = user_db.get('users[' + ref + '].role').value(); 

    if (role == "User") {
        user_db.get('users[' + ref + ']').set('role', 'Admin').write();
        user_db.get('users[' + ref + ']').set('status', 'Active').write();
        return res.sendStatus(200);
    }

    else if (role == "Admin") {
        user_db.get('users[' + ref + ']').set('role', 'User').write();
        return res.sendStatus(200);
    }
})

app.put('/api/admin/reviews/switchflag', authenticateAdminToken, (req, res) => { // Change review visibility from public to private or vice versa
    const admin = req.username;

    if (!admin) {
        return res.sendStatus(403);
    }

    const review_id = req.body.review_id;
    let review_array = review_db.get('reviews').value();
    let ref;

    for (i = 0; i < review_array.length; i++) {
        if (review_array[i].review_id == review_id) {
            ref = i;
        }
    }

    let visibility = review_db.get('reviews[' + ref + '].visibility').value();

    if (visibility == "Public") {
        review_db.get('reviews[' + ref + ']').set('visibility', 'Hidden').write();        
        return res.sendStatus(200);
    }

    else if (visibility == "Hidden") {
        review_db.get('reviews[' + ref + ']').set('visibility', 'Public').write(); 
        return res.sendStatus(200);
    }
})

app.put('/api/admin/users/switchflag', authenticateAdminToken, (req, res) => { // Make a user inactive or active
    const admin = req.username;

    if (!admin) {
        return res.sendStatus(403);
    }

    const email = req.body.email;
    let user_array = user_db.get('users').value();
    let ref;

    for (i = 0; i < user_array.length; i++) {
        if (user_array[i].email == email) {
            ref = i;
        }
    }

    let status = user_db.get('users[' + ref + '].status').value(); 

    if (status == "Inactive") {
        user_db.get('users[' + ref + ']').set('status', 'Active').write();        
        return res.sendStatus(200);
    }

    else if (status == "Active") {
        user_db.get('users[' + ref + ']').set('status', 'Inactive').write();   
        return res.sendStatus(200);
    }
})

// Access token generator with refresh token
app.post('/api/protected/token', (req,res) => {
    const refreshToken = req.header('x-refresh-token');
    if (refreshToken == null) {
        res.sendStatus(401)
    }

    const value = token_db.get('tokens').find({ refreshToken: refreshToken}).value();

    if (value == null) {
        return res.sendStatus(403) // refresh token is not in list
    }

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (error, user) => {
        if (error) {
            return res.sendStatus(403) // invalid token
        } else {
            const accessToken = generateAccessToken({ username: user.username })
            res.json({ accessToken: accessToken })
        }
    })   
})

// Logout from session 
app.delete('/api/public/logout', (req, res) => {
    const refreshToken = req.header('x-refresh-token');
    
    if (refreshToken == null) {
        return res.sendStatus(401)
    }

    token_db.get('tokens').remove({ refreshToken: refreshToken }).write();
    return res.status(204).send({
        message: "Refresh Token Deleted and Session Ended"
    })
})

// SCHEDULE LOGIC

app.put('/api/private/schedules/createschedule', authenticateToken, (req, res) => { // default private schedule created by verified user
    const username = req.username;
    const schedule_name = req.body.schedule_name;
    const schedule_description = req.body.schedule_description;
    
    const result = validateSchedule(schedule_name);   
    
    if (result.error) {
        return res.status(400).send({
            message: "Schedule Name Is Invalid"
        });
    }

    db.get('schedules').push({ schedule_creator: username, schedule_flag: 'Private', schedule_id: schedule_name, schedule_description: schedule_description, schedule_information: []}).write()

    return res.status(200).send({
        message: "Status 200 OK, schedule added",
        name: schedule_name
    });
});

app.put('/api/public/schedules/createschedule/:schedule_name', (req, res) => { // Publicly created schedule
    const schedule_name = req.params.schedule_name;    

    const result = validateSchedule(schedule_name);   
    
    if (result.error) {
        return res.status(400).send({
            message: "Schedule Name Is Invalid"
        });
    }

    db.get('schedules').push({ schedule_creator: "Unverified User", schedule_flag: 'Public', schedule_id: schedule_name, schedule_description: "None", schedule_information: []}).write()

    return res.status(200).send({
        message: "Status 200 OK, schedule added",
        name: schedule_name
    });
});

app.get('/api/private/schedules/listmyschedules', authenticateToken, (req, res) => { // Show schedules by user
    const username = req.username;    
    const schedules = db.get('schedules').filter({ schedule_creator: username }).value();
    res.send(schedules)
});

app.delete('/api/private/schedules/deleteschedule/:schedule_id', authenticateToken, (req, res) => { // Delete one schedule made by user
    const schedule_id = req.params.schedule_id;    
    const username = req.username;

    sched_array = db.get('schedules').map('schedule_id').value();
    
    db.get('schedules').remove({ schedule_id: schedule_id}).write();

    return res.status(200).send({
        message: "Schedule Deleted"
    })
})

app.delete('/api/private/schedules/deleteall', authenticateToken, (req, res) => { // Delete all schedules made by one user
    const username = req.username;
    db.get('schedules').remove({ schedule_creator: username }).write();

    return res.status(200).send({
        message: "All Schedules Deleted"
    })
})

app.get('/api/private/schedules/load/:schedule_name', authenticateToken, (req, res) => { // Show courses inside invidual schedule for user
    const data = req.params.schedule_name;
    
    const sched_array = db.get('schedules').map('schedule_id').value();
    
    let ref;

    for (i = 0; i < sched_array.length; i++) {
        if (sched_array[i] == data) {
            ref = i;
        }
    }

    const array_list = db.get('schedules[' + ref + '].schedule_information').write();
    const flag = db.get('schedules[' + ref + '].schedule_flag').value();
    return res.json({ array_list, flag });    
});

app.get('/api/public/schedules/load/:owner/:schedule_name', (req, res) => { // Show courses inside public schedule
    const name = req.params.schedule_name;
    const user = req.params.owner;

    const sched_array = db.get('schedules').value();
    
    let ref;

    for (i = 0; i < sched_array.length; i++) {
        if (db.get('schedules[' + i + '].schedule_id').value() == name && db.get('schedules[' + i + ']schedule_creator').value() == user) {
            ref = i;
        }
    }    

    let flag = db.get('schedules[' + ref + '].schedule_flag').value();
    let owner = db.get('schedules[' + ref + '].schedule_creator').value();
    let description = db.get('schedules[' + ref + '].schedule_description').value();

    if (flag != "Private") {
        const array_list = db.get('schedules[' + ref + '].schedule_information').write();
        res.json({ array_list, owner, description });
    }

    else {
        return res.status(401).send({
            message: "Access Not Allowed"
        });
    }
});

app.get('/api/schedules/check', (req, res) => { // Check before a course already exists in the schedule before adding it
    const sched_name = req.query.schedule_name;
    const crs_code = req.query.course_code;
    const crs_name = req.query.course_name;

    sched_array = db.get('schedules').map('schedule_id').value();
    
    for (i = 0; i < sched_array.length; i++) {
        if (sched_array[i] == sched_name) {
            var ref_num = i;            
        }
    }

   course_array = db.get('schedules[' + ref_num + '].schedule_information').map().value();   
   
   for (i = 0; i < course_array.length; i++) {
       if (course_array[i].course_code == crs_code && course_array[i].course_name == crs_name) {
        return res.status(200).send({
            message: "Exists"
        });        
        }  
    } 

    return res.status(200).send({
        message: "Course does not exist"
    });   
});

app.put('/api/private/schedules/addcourse/:schedule_name', authenticateToken, (req, res) => { // Put a course inside a schedule
    
    const sched_name = req.params.schedule_name;
    const course_name = req.body.course_name;
    const sbj_code = req.body.subject_code;    
    const crs_code = req.body.course_code;

    const sched_array = db.get('schedules').map('schedule_id').value();
    
    let ref;

    for (i = 0; i < sched_array.length; i++) {
        if (sched_array[i] == sched_name) {
            ref = i;
        }
    }

    db.get('schedules[' + ref + '].schedule_information').push({ course_name: course_name, subject_code: sbj_code, course_code: crs_code }).write();
    
    return res.status(200).send({
        message: "Course Added"
    });
});

app.put('/api/public/schedules/addcourse/:schedule_name', (req, res) => {
    const sched_name = req.params.schedule_name;
    const course_name = req.body.course_name;
    const sbj_code = req.body.subject_code;    
    const crs_code = req.body.course_code;

    const sched_array = db.get('schedules').map('schedule_id').value();
    
    let ref;

    for (i = 0; i < sched_array.length; i++) {
        if (sched_array[i] == sched_name) {
            ref = i;
        }
    }

    db.get('schedules[' + ref + '].schedule_information').push({ course_name: course_name, subject_code: sbj_code, course_code: crs_code }).write();
    
    return res.status(200).send({
        message: "Course Added"
    });
});

app.get('/api/schedules/dropdown', authenticateToken, (req, res) => { // Return user specific schedules
    const username = req.username;
    
    let name_array = [];
    name_array = db.get('schedules').map('schedule_id').value();  
    res.send(name_array);
});

app.get('/api/public/schedules/dropdown', (req, res) => { // Return public schedules
    let name_array = [];
    name_array = db.get('schedules').filter({ schedule_flag: "Public" }).value();
    res.send(name_array)
});

app.put('/api/private/schedules/courses/add-review', authenticateToken, (req, res) => { // User can write review for specific course
    const username = req.username;
    const course = req.body.course;
    const review = req.body.review;

    const review_id = crypto.randomBytes(10).toString('hex');

    review_db.get('reviews').push({ username: username, review_id: review_id, course: course, review: review , visibility: "Public" }).write();

    return res.status(200).send({
        message: "Review Added"
    })
});

app.get('/api/public/courses/get-review', (req, res) => { // All reviews
   let review_array = review_db.get('reviews').filter({ visibility: "Public" }).value();
   res.send(review_array);
});

app.get('/api/private/schedules/:schedule_name/switchflag', authenticateToken, (req, res) => {
    const username = req.username;
    const sched_name = req.params.schedule_name;

    const sched_array = db.get('schedules').value();
    
    let ref;

    for (i = 0; i < sched_array.length; i++) {
        if (db.get('schedules[' + i + '].schedule_creator').value() == username && db.get('schedules[' + i + '].schedule_id').value() == sched_name) {
            ref = i;
        }        
    }

    let flag = db.get('schedules[' + ref + '].schedule_flag').value(); 

    
    if (flag == "Private") {
        db.get('schedules[' + ref + ']').set('schedule_flag', 'Public').write();
        return res.status(200).send({
            message: "Visibility Changed"
         });
    }

    else if (flag == "Public") {
        db.get('schedules[' + ref + ']').set('schedule_flag', 'Private').write();
        return res.status(200).send({
            message: "Visibility Changed"
         });
    }   
});

// COURSE LOGIC

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

app.get('/api/private/schedulecheck/:schedule_name', authenticateToken, (req, res) => { // Check if authenticated user has duplicate schedule names
    const username = req.username;
    const schedule_name = req.params.schedule_name;
    
    const sched_array = db.get('schedules').filter({ schedule_creator: username }).value();

    for (i = 0; i < sched_array.length; i++) {
        if (sched_array[i].schedule_id == schedule_name) {
            return res.json("Schedule Exists")
        }
    }

    return res.json("Schedule Does Not Exist");
});

app.get('/api/public/schedulecheck/:schedule_name', (req, res) => { // Check if any unverified user has duplicate schedule names
    const schedule_name = req.params.schedule_name;
    const sched_array = db.get('schedules').filter({ schedule_creator: "Unverified User" }).value();

    for (i = 0; i < sched_array.length; i++) {
        if (sched_array[i].schedule_id == schedule_name) {
            return res.json("Schedule Exists")
        }
    }

    return res.json("Schedule Does Not Exist");
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