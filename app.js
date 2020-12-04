const express = require('express');
const app = express();
const data = require("./Lab3-timetable-data.json");
const bcrypt = require('bcrypt'); // Password hashing
const crypto = require('crypto'); // Random review ID
const jwt = require('jsonwebtoken'); // JSON Web Token
const bodyParser = require('body-parser'); // Self explanatory
const stringSimilarity = require('string-similarity'); // String similarity library

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
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');
const { response } = require('express');

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
    res.header("Content-Type", "application/json");
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

function validateUsername(username) {
    const specialChar = /^[^<>:/?#@!$&'()*+,;=]*$/;
    const schema = Joi.object({
        name: Joi.string().min(3).regex(specialChar).required() // Username cannot be blank space or have any URL confusing characters
    });
    return schema.validate({ name: username });
}

function validatePassword(password) {
    //const specialChar = /^[^<>:/?!$&'()*+,;=]*$/;
    const schema = Joi.object({
        name: Joi.string().min(6).required() // Username cannot be blank space or have any URL confusing characters
    });
    return schema.validate({ name: password});
}

function validateString(textline) {
    const specialChar = /^[^<>:/?#@!$&'()*+,;=]*$/;
    const schema = Joi.object({
        name: Joi.string().min(4).regex(specialChar).required() // Username cannot be blank space or have any URL confusing characters
    });
    return schema.validate({ name: textline });
}

function validateReview(review_text) {
    const specialChar = /^[^<>:/#@$&'()*+,;=]*$/;
    const schema = Joi.object({
        name: Joi.string().min(4).max(250).regex(specialChar).required() // Username cannot be blank space or have any URL confusing characters
    });
    return schema.validate({ name: review_text });
}

function getCurrentTime() { // Time function for logging whenever review is made or user modifies schedule
    const date = new Date();
    let hh = date.getHours();
    let mm = date.getMinutes();
    let ss = date.getSeconds();
    let mo = date.getMonth();
    let yr = date.getFullYear();
    let dy = date.getDate();

    hh = hh < 10 ? '0'+hh : hh; 
    mm = mm < 10 ? '0'+mm : mm;
    mo = mo + 1;

    curr_time = yr + '/'+ mo + '/' + dy + ' ' + hh+':'+mm+':'+ss;
    return String(curr_time);
}

function getRawTime() {
    const time = new Date();
    return time.getTime();
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
    const user_result = validateUsername(username);
    const pass_result = validatePassword(password);

    if (result.error) {
        return res.send({ message: "Invalid Email" });
    }

    else if (user_result.error) {
        return res.send({ message: "Invalid Username" });
    }

    else if (pass_result.error) {
        return res.send({ message: "Invalid Password" });
    }

    let doesExist = user_db.get('users').map({ email: email }).value();

    if (doesExist == "true") {
        return res.send({ message: "Exists" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10) // 10 is a good amount of rounds   
        const hashedEmail = await bcrypt.hash(email, 10) // once again 10     
        user_db.get('users').push({ username: username, email: email, password: hashedPassword, role: 'User', status: 'Unverified' }).write(); // All users are inactive by default unless click on verification or admin changes
        user_db.get('links').push({ email: email, link: hashedEmail }).write();
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
    
    if (!email && !password) {
        return res.send({ message: "Fill Out All Input Fields" });  
    }

    if (!email) {
        return res.send({ message: "Fill Out Email Field" });        
    }

    if (!password) {
        return res.send({ message: "Fill Out Password Field" });
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
                username: user.username,
                message: "Administrator"
            })
        }   catch {
                return res.send({
                message: "Unable to login"
            })
        }       
    }
    
    const user = user_db.get('users').find({ email: email }).value();
    
    if (user == null) {
        return res.send({
            message: "Email Not Found"
        })
    }

    else if (user.status == "Inactive") {
        return res.send({ message: "Account Inactive, Contact Administrator" });
    }   
    
    try {        
        if (await bcrypt.compare(password, user.password)) { 
            
            if (user.status == "Unverified") {
                const tokendata = user_db.get('links').find({ email: email }).value()
                return res.send({ message: "Account Is Not Verified", tokendata });
            }

            if (user.role == "Admin") {

                let admin_user = {
                    email,
                    password,
                    username: user.username
                }

                    const adminAccessToken = generateAdminAccessToken(admin_user); // Login successful, so make admin access token
                    const adminRefreshToken = jwt.sign(admin_user, ADMIN_TOKEN_SECRET); // Refresh token to make new admin tokens
                    token_db.get('tokens').push( { adminRefreshToken: adminRefreshToken }).write();
                    return res.send({
                        accessToken: adminAccessToken,
                        refreshToken: adminRefreshToken,
                        username: user.username,
                        message: "Administrator"
                    })
            }

            const accessToken = generateAccessToken(user); // Login successful, so make access token
            const refreshToken = jwt.sign(user, REFRESH_TOKEN_SECRET); // Refresh token to make new access tokens     
            token_db.get('tokens').push({ refreshToken: refreshToken }).write(); // Insert refresh token into persistent database     
            res.send({
                accessToken: accessToken,
                refreshToken: refreshToken,
                username: user.username
            })
        } else {
            return res.send({
                message: "Wrong Password"
            })
        }
    } catch {
        return res.send({
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

app.get('/api/private/userinfo', authenticateToken, (req, res) => { // Returns user info
    let token = req.header('x-access-token')
    
    jwt.verify(token, ACCESS_TOKEN_SECRET, (error, user) => {
        if (error) {
            return res.sendStatus(403);
        }

        return res.send({ 
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status,
            }
        );
    })    
})

app.put('/api/private/updatepassword', authenticateToken, async (req, res) => { // Update user password
    let old_pass = req.body.old_password;
    let new_pass = req.body.new_password;
    let email = req.body.email;    
    
    const result = validatePassword(new_pass);

    if (result.error) {
        return res.send({ message: "Password must be at least 6 characters" });
    }

    let user_array = user_db.get('users').value();
    let ref;

    for (i = 0; i < user_array.length; i++) {
        if (user_array[i].email == email) {
            ref = i;
        }
    }  
    
    if (ref == null) {
        return res.status(400).send({
            message: "Email not found"
        })
    }      

    const current_password = user_db.get('users[' + ref + '].password').value();   

    try {        
        if (await bcrypt.compare(old_pass, current_password)) {
            const hashedPassword = await bcrypt.hash(new_pass, 10); // 10 is a good amount of rounds 
            user_db.get('users[' + ref + ']').set('password', hashedPassword).write();
            return res.send({ message: "Password Successfully Changed" });
        }

    } catch {
        return res.status(500).send({
            message: "Unable To Change Password"
        })
    } 

    return res.send({ message: "Unable To Change Password" });
})

// Secure path checking for common user
app.get('/api/secure/userpath', authenticateToken, (req, res) => { // Run this on init every time a secure path is accessed so redirect can happen
    return res.sendStatus(200);
})

app.get('/api/secure/adminpath', authenticateAdminToken, (req, res) => { // Run this on init every time a secure path is accessed so redirect can happen
    return res.sendStatus(200);
})

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

    const user_email = req.body.email;
    
    let user_array = user_db.get('users').value();
    let ref;

    for (i = 0; i < user_array.length; i++) {
        if (user_array[i].email == user_email) {
            ref = i;
        }
    }

    let role = user_db.get('users[' + ref + '].role').value(); 

    if (role == "User") {
        user_db.get('users[' + ref + ']').set('role', 'Admin').write();
        user_db.get('users[' + ref + ']').set('status', 'Active').write();
        return res.send({ message: "Role is Now Admin" });
    }

    else if (role == "Admin") {
        user_db.get('users[' + ref + ']').set('role', 'User').write();
        return res.send({ message: "Role Is Now User" });
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
        return res.send({ message: "Review is Now Hidden" });
    }

    else if (visibility == "Hidden") {
        review_db.get('reviews[' + ref + ']').set('visibility', 'Public').write(); 
        return res.send({ message: "Review is Now Public" });
    }
})

app.get('/api/admin/reviews/displayall', authenticateAdminToken, (req, res) => {
    const admin = req.username;

    if (!admin) {
        return res.sendStatus(403);
    }

    let review_array = review_db.get('reviews').value();
    return res.send(review_array);
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
        return res.send({ message: "Status Is Now Active" });
    }

    else if (status == "Active") {
        user_db.get('users[' + ref + ']').set('status', 'Inactive').write();   
        return res.send({ message: "Status Is Now Inactive" });
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
    token_db.get('tokens').remove({ adminRefreshToken: refreshToken }).write();

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

    db.get('schedules').push({ schedule_creator: username, schedule_flag: 'Private', schedule_id: schedule_name, schedule_description: schedule_description, last_modified: getCurrentTime(), raw_time: getRawTime(), schedule_information: []}).write()

    return res.status(200).send({
        message: "Status 200 OK, schedule added",
        name: schedule_name
    });
});

app.post('/api/private/schedules/edit', authenticateToken, (req, res) => {
    const username = req.username;
    const old_schedule_name = req.body.old_schedule_name;
    const new_schedule_name = req.body.new_schedule_name;
    const new_schedule_description = req.body.new_schedule_description;

    const result = validateSchedule(new_schedule_name);

    if (result.error) {
        return res.sendStatus(400);
    }

    let ref;

    let sched_array = db.get('schedules').value();

    for (i = 0; i < sched_array.length; i++) {
        if (sched_array[i].schedule_id == old_schedule_name && sched_array[i].schedule_creator == username) {
            ref = i;
        }
    }   

    db.get('schedules[' + ref + ']').set('schedule_id', new_schedule_name).write();
    db.get('schedules[' + ref + ']').set('schedule_description', new_schedule_description).write();
    db.get('schedules[' + ref + ']').set('last_modified', getCurrentTime()).write();
    db.get('schedules[' + ref + ']').set('raw_time', getRawTime()).write();

    return res.status(200);
})

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
    const time = db.get('schedules[' + ref + '].last_modified').value();
    return res.json({ array_list, flag, time });    
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
    let time = db.get('schedules[' + ref + '].last_modified').value();
    let owner = db.get('schedules[' + ref + '].schedule_creator').value();
    let description = db.get('schedules[' + ref + '].schedule_description').value();

    if (flag != "Private") {
        const array_list = db.get('schedules[' + ref + '].schedule_information').write();
        res.json({ array_list, owner, description, time });
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

app.put('/api/private/schedules/addcourse/:schedule_name', authenticateToken, (req, res) => { // Put a course inside a user schedule
    
    const sched_name = req.params.schedule_name;
    const course_name = req.body.course_name;
    const sbj_code = req.body.subject_code;    
    const crs_code = String(req.body.course_code);

    const sched_array = db.get('schedules').map('schedule_id').value();
    
    let ref;

    for (i = 0; i < sched_array.length; i++) {
        if (sched_array[i] == sched_name) {
            ref = i;
        }
    }

    db.get('schedules[' + ref + '].schedule_information').push({ course_name: course_name, subject_code: sbj_code, course_code: crs_code }).write();
    db.get('schedules[' + ref + ']').set('last_modified',getCurrentTime()).write();
    db.get('schedules[' + ref + ']').set('raw_time',getRawTime()).write();

    return res.status(200).send({
        message: "Course Added"
    });
});

app.put('/api/private/schedules/deletecourse/:schedule_name', authenticateToken, (req, res) => { // Delete a course from user schedule
    const sched_name = req.params.schedule_name;
    const crs_name = req.body.course_name;
    const sbj_code = req.body.subject_code;    
    const crs_code = req.body.course_code;

    const sched_array = db.get('schedules').map('schedule_id').value();

    let ref;

    for (i = 0; i < sched_array.length; i++) {
        if (sched_array[i] == sched_name) {
            ref = i;
        }
    }

    if (ref == null) {
        return res.send({ message: "Schedule Not Found" });
    }

    const course_array = db.get('schedules[' + ref + '].schedule_information').value();

    let counter;

    for (i = 0; i < course_array.length; i++) {
        if ((course_array[i].course_name == crs_name) && (course_array[i].subject_code == sbj_code) && (course_array[i].course_code == crs_code)) {
            counter = i;
        }
    }    

    if (counter == null) {
        return res.send({ message: "Course Not Found" });
    } else {
        db.get('schedules[' + ref + '].schedule_information').remove({ course_name: crs_name, subject_code: sbj_code, course_code: crs_code }).write();
        db.get('schedules[' + ref + ']').set('last_modified',getCurrentTime()).write(); 
        db.get('schedules[' + ref + ']').set('raw_time',getRawTime()).write();       
        return res.send({ message: "Course Removed" });
    }
})

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

app.get('/api/public/schedules/dropdown', (req, res) => { // Return public schedules in sorted time modified order
    let name_array = [];
    let unsorted_array = [];
    let response_array = [];
    name_array = db.get('schedules').filter({ schedule_flag: "Public" }).value();

    for (i = 0; i < name_array.length; i++) {
        unsorted_array.push(name_array[i].raw_time);
    }

    const sorted_array = unsorted_array.sort(function(a, b){return a - b});

    for (i = 0; i < sorted_array.length; i++) {
        for (j = 0; j < name_array.length; j++) {
            if (sorted_array[i] == name_array[j].raw_time) {
                response_array.push(name_array[j]);
            }
        }
    }

    res.send(response_array);
});

app.put('/api/private/schedules/courses/add-review', authenticateToken, (req, res) => { // User can write review for specific course
    const username = req.username;
    const course = req.body.course;
    const review = req.body.review;

    const result = validateReview(review);

    if (result.error) {
        return res.send({ message: "Error" });
    }

    const review_id = crypto.randomBytes(10).toString('hex');

    review_db.get('reviews').push({ username: username, review_id: review_id, course: course, review: review , time_created: getCurrentTime(), visibility: "Public" }).write();

    return res.status(200).send({
        message: "Review Added"
    })
});

app.get('/api/public/courses/get-review', (req, res) => { // All reviews
   let review_array = review_db.get('reviews').filter({ visibility: "Public" }).value();
   res.send(review_array);
});

app.get('/api/public/courses/get-course-review/:course_name', (req, res) => { // Get specific review
    const course_name = req.params.course_name;
    let review_array = [];
    let course_review = review_db.get('reviews').value();    

    for (i = 0; i < course_review.length; i++) {
        if (course_review[i].course == course_name) {
            review_array.push(course_review[i]);
        }
    }

    return res.send(review_array);
})

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

// Soft match string search method
var data_array = [];

for (i = 0; i < data.length; i++) {
    data_array.push(data[i].className);
    data_array.push(String(data[i].catalog_nbr));
}

app.get('/api/courses/softmatch/:user_string', (req, res) => { // Search method
    const user_string = req.params.user_string.toUpperCase();
    const result = validateString(user_string);

    if (result.error) {
        return res.send({
            message: "Invalid String"
        });
    }

    const test_array = removeDuplicates(data_array);
    const results = stringSimilarity.findBestMatch(user_string, test_array);    
    let refined_results = results.ratings.filter(result => result.rating > 0.3); // If rating is above 0.2 then results go through   
    let final_array = [];

    for (i = 0; i < refined_results.length; i++) {
        for (j = 0; j < data.length; j++) {
            if (refined_results[i].target == data[j].className || refined_results[i].target == String(data[j].catalog_nbr)) {
                final_array.push(data[j]);
            }
        }
    }

    return res.send(final_array);
})

app.get('/api/courses/info/:className/:subjectcode/:coursecode', (req, res) => { // Show information for an individual course
    const class_Name = req.params.className;
    const subject_code = req.params.subjectcode;
    const course_code = req.params.coursecode;

    let ref;

    for (i = 0; i < data.length; i++) {
        if (class_Name == data[i].className && subject_code == data[i].subject && course_code == data[i].catalog_nbr) {
            ref = i;
        }
    }

    const course_item = data[ref];
    return res.send(course_item);
})

// Three parameter search method
app.get('/api/courses', (req, res) => {
    let final_array = [];
    let subject = req.query.subject.toUpperCase();
    let course_code = req.query.course_number.toUpperCase();
    
    if (!course_code) { // search by subject only
        
        if (subject == "ALL SUBJECTS") {
            for (i = 0; i < data.length; i++) {
                final_array.push(data[i]);
            }

            return res.send(final_array);
        }

        else if (subject != "ALL SUBJECTS") {
            for (i = 0; i < data.length; i++) {
                if (subject == data[i].subject) {
                    final_array.push(data[i]);
                }
            }

            return res.send(final_array);
        }
    }

    else if (course_code != null && subject == "ALL SUBJECTS") { // search by course_code only IF NOT A NUMBER, THEN TRUE, IF NUMBER THEN FALSE    
        
        isANumber = isNaN(course_code);        

        if (isANumber == false) { // if user enters without letter

            for (i = 0; i < data.length; i++) {
                let result = stringSimilarity.compareTwoStrings(course_code, String(data[i].catalog_nbr));
                    if (result > 0.85) {
                    final_array.push(data[i]);
                }
            }   

            return res.send(final_array);
        }    

        else if (isANumber == true) { // if user enters with letter

            for (i = 0; i < data.length; i++) {
                if (course_code == data[i].catalog_nbr) {
                    final_array.push(data[i]);
                }
            }

            return res.send(final_array);
        }
    }

    else if (course_code != null && subject != "ALL SUBJECTS") {

        isANumber = isNaN(course_code);
        

        if (isANumber == false) { // if user enters 4 numbers no letter and a valid subject

            for (i = 0; i < data.length; i++) {
                if (subject == data[i].subject) {
                    let result = stringSimilarity.compareTwoStrings(course_code, String(data[i].catalog_nbr));
                    if (result > 0.85) {
                        final_array.push(data[i]);
                    }
                }
            }

            return res.send(final_array);
        }

        else if (isANumber == true) {
            
            for (i = 0; i < data.length; i++) {
                if (subject == data[i].subject && course_code == String(data[i].catalog_nbr)) {
                    final_array.push(data[i]);
                }
            }

            return res.send(final_array);
        }        
    }

    return res.send({ message: 'Course Not Found' });
});

// Use port 3000 unless preconfigured port exists
var port = process.env.port || 3000
app.listen(port, () => console.log('Server Is Now Running'));