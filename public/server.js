#!/usr/bin/nodejs

// -------------- load packages -------------- //
// INITIALIZATION STUFF

var express = require('express');
var app = express();
var formidable = require('formidable');
var path = require('path');
var mysql = require('mysql');
var hbs = require('hbs');
var fs = require('fs');
var crypto = require('crypto');
var bodyParser = require('body-parser');

// -------------- express initialization -------------- //
// PORT SETUP - NUMBER SPECIFIC TO THIS SYSTEM

app.set('port', process.env.PORT || 8080 );
app.set('view engine', 'hbs');  //setting view engine to hbs

// -------------- serve static folders -------------- //
app.use('/html', express.static(path.join(__dirname, 'html')))
app.use('/js', express.static(path.join(__dirname, 'js')))
app.use('/css', express.static(path.join(__dirname, 'css')))
app.use('/data/uploaded_files', express.static(path.join(__dirname, '/data/uploaded_files')))
app.use('/images/icon', express.static(path.join(__dirname, 'images/icon')))
app.use(express.json()) //double check what this does


// -------------- create sql database on server start ---------------- //

var pool  = mysql.createPool({
  connectionLimit : 10,
  host            : '~',
  user            : '~',
  password        : '~',
  database        : '~'
});

// -------------- middleware functions -------------- //

// -------------- bodyParser setup -------------- //
app.use(bodyParser.urlencoded({ extended: false})); 
app.use(bodyParser.json());

// -------------- express 'get' handlers -------------- //
// These 'getters' are what fetch your pages

app.get('/', function(req, res){
    res.sendFile( path.join(__dirname, 'html', 'home.html') );
});


app.get('/advanced_search', function(req, res){
   res.sendFile( path.join(__dirname, 'html', 'advanced_search.html') ); 
});

app.get('/about_me', function(req, res){
   res.sendFile( path.join(__dirname, 'html', 'about_me.html') ); 
});

app.get('/info', function(req, res){
   res.sendFile( path.join(__dirname, 'html', 'info.html') ); 
});

app.get('/login', function(req, res){
   res.sendFile( path.join(__dirname, 'html', 'login.html')); 
});

app.post('/login_post', function(req, res){
    var sql_query_login = "SELECT * FROM user_info WHERE username = '" + req.body.username + "'";
    console.log("SQL command called: " + sql_query_login);
    pool.query(sql_query_login, function (error, results, fields_query){
        if (error)
        {
            throw error;
        }
        else
        {
            if(results == 0)
            {
                res.send("0");
            }
            else
            {
                const password_hash = crypto.createHash('sha256').update(req.body.password + results.salt).digest("hex");
                var sql_query_login = "SELECT * FROM user_info WHERE id = '" + req.body.username + "'" + " AND " + "password = '" + password_hash + "'";
                if(password_hash == results.password && username == req.body.username)
                {
                    res.send("1")
                }
                else
                {
                    res.send("0")
                }
            }
        }
    });
});

app.get('/check_hash', function(req, res){

    var checksum = req.query.hash;
    
    var sql_query_id = "SELECT * FROM file_info WHERE id = '" + checksum + "'";
    console.log("SQL command called: " + sql_query_id);
    pool.query(sql_query_id, function (error, results, fields_query)
    {
        
        if (error)
        {
            throw error;
        }
        else
        {
            if(results.length === 0)
            {
                res.send("0"); //does not exist in database
            }
            else
            {
                res.send("1"); //exists in database
            }
        }
    });
    
});

app.post('/save_file', function(req,res){

    var form = new formidable.IncomingForm(); //form reading through formidable
    form.on('fileBegin', function(name, file){
        console.log("File_name" + file.name);
        res.locals.file_name = file.name;  //storing in res.locals for access later
        res.locals.file_extension = "." + (file.name).slice((Math.max(0, (file.name).lastIndexOf(".")) || Infinity) + 1); //determines file extension
        file.path = __dirname + '/data/uploaded_files/' + file.name;  //need to change file name to hash 
    });
    form.parse(req, function(err, fields)
    {
        var vals = [path.parse(res.locals.file_name).name, fields.checksum, "Anonymous", fields.subject, Math.round(+new Date()/1000), res.locals.file_extension, fields.info_tags];
        console.log("FILE Name:" + res.locals.file_name);
        fs.rename("data/uploaded_files/" + res.locals.file_name, "data/uploaded_files/" + fields.checksum + res.locals.file_extension, (err) => {
          if (err) throw err;
        });
        var sql_insert = "INSERT INTO file_info(file_name, id, uploader, subject, date, extension, info_tags) VALUES (?, ?, ?, ?, ?, ?, ?)";  //inserts file info into SQL databsase
        console.log("SQL command called : " + sql_insert);
        
        pool.query(sql_insert, vals, function (error, results, fields) //npm link on usefulLink
        {
            if (error)
            {
                console.log("Error on inserting into SQL database");
                throw error;
            }
            else
            {
                res.send("");  //changed from res.send("");
            }
        });
        
    });
});

app.get('/database_query' , function(req, res){
    
    const no_extension = path.parse(req.query.file_name).name
    console.log(no_extension + " is the name")
    const sql_query = "SELECT * FROM file_info WHERE file_name='" + no_extension + "'";
    console.log(sql_query);
    pool.query(sql_query, function( error, results, fields){
        if (error)
        {
            console.log("Error on querying SQL database");
            throw error;
        }
        else
        {   
            console.log('------------------------------------------------------------------------------------------------------------------');
            console.log(results);
            render_dictionary = {};
            tmp_array = [];
            for(x = 0; x < results.length; x++)
            {
                var date = parseInt(results[x].date);  //can be used to convert unix time back into date readable by user
                var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
                d.setUTCSeconds(date);
                var dateString = d.getUTCHours() + ":" + d.getUTCMinutes() + ":" + d.getUTCSeconds() + " " + d.getUTCFullYear() +"/"+ (d.getUTCMonth()+1) +"/"+ d.getUTCDate();  //neat formatting
                tmp_array.push( { file_name:results[x].file_name+results[x].extension, id:"/data/uploaded_files/"+results[x].id+results[x].extension, uploader:results[x].uploader, subject:results[x].subject, date:dateString} )
            }
            render_dictionary["results"] = tmp_array;
            console.log(render_dictionary);
            res.render('results', render_dictionary);
        }
    })
});

app.get('/account_creation', function(req, res){
    res.sendFile( path.join(__dirname, 'html', 'account_creation.html') );
});

app.post('/account_creation_post', function(req,res){
    console.log("Post started")
    var sql_query = "SELECT * FROM user_info WHERE username='" + req.body.username + "'";
    console.log(sql_query);
    pool.query(sql_query, function( error, username_results, fields){
        if (error)
        {
            console.log("Error on username query");
            throw error;
            res.send("3");
        }
        else
        {   
            if(username_results.length != 0)
            {
                res.send("0");  //username already exists 
            }
            else
            {
                sql_query = "SELECT * FROM user_info WHERE email='" + req.body.email + "'";
                pool.query(sql_query, function( error, email_results, fields){
                    if (error)
                    {
                        console.log("Error on email SQL database");
                        throw error;
                        res.send("3");
                    }
                    else
                    {   
                        if(email_results.length != 0)
                        {
                            res.send("1");  //email already in use
                        }
                        else
                        {
                            const salt = crypto.randomBytes(16).toString('hex');
                            const password_hash = crypto.createHash('sha256').update(req.body.password + salt).digest("hex");
                            const vals = [req.body.username, password_hash, salt, req.body.first_name, req.body.last_name, req.body.email]
                            const sql_insert = "INSERT INTO user_info(username, password_hash, salt, first_name, last_name, email) VALUES (?, ?, ?, ?, ?, ?)";
                            pool.query(sql_insert, vals, function( error, results, fields){
                                if (error)
                                {
                                    console.log("Error on inserting into SQL database");
                                    throw error;
                                    res.send("3");
                                }
                                else
                                {
                                    res.send("2");  //successful accoutn creation
                                }
                            });
                            //end
                        }
                    }
                });
            }
        }
    });
});

app.post('/login_post', function(req,res){
    console.log("Username: " + req.body.username);
    console.log("Password: " + req.body.password);
    res.send("0");
});


//THIS IS USED TO SORT BY DATE DESC
// ------------------------------------------------------------------------------------------------------------------//
// var sql_query_id = "SELECT * FROM file_info ORDER BY date DESC"  //just to query, may need to be moved
// pool.query(sql_query_id, function (error, results, fields) //npm link on usefulLink
// {
    
//   if (error)
//   {
//       console.log("Error on " + sql_query_id);
//       throw error;
//   }
//   else
//   {
//         console.log("ID Results: \r");
//         console.log(results);   //seperated to prevent object object error
//   }
  
// });



// -------------- listener -------------- //
// // The listener is what keeps node 'alive.' 

var listener = app.listen(app.get('port'), function() {
  console.log( 'Express server started on port: '+listener.address().port );
});
