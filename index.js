"use strict";
setTimeout(addStylesAndLibrary,5000);
var io = require('indian-ocean');
var parse = require('csv-parse/lib/sync');
var readDir = require('readdir');
var path = require('path');
var fs = require("fs");
var firebaseAdmin = require('firebase-admin');
const firebase = require('firebase');
var serviceAccount = require('/Users/akashpaul/Documents/abvr/cred/norahanimation-firebase-adminsdk-qmwir-c655942ff4.json');

firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: 'https://norahanimation.firebaseio.com'
});

const app = firebase.initializeApp({ databaseURL: "https://norahanimation.firebaseio.com" })
const db = app.database();
const PROJECT_ID = "norahanimation";
var styleCount =      0;
var libraryCount =    0;
var styleArray =     [];
var libraryArray =   [];
var matchedArray =   [];
var style2bArray = [];

// Push UIDs & number of style entries
var style_data = io.readDataSync('uid_style_and_lib.csv',function (row, i, columns) {
    styleCount=styleCount+1;
    row.number = +row.number // Convert this value to a number
    //console.log(count+" with UID "+row.uid+" "+row.number);
    styleArray.push({'uid':row.uid,'styleNumber':row.number})
    //console.log(poolArray[count-1].uid);
    return row
  })

// Push UIDs & number of library entries
var lib_data = io.readDataSync('uid_lib_nos.csv',function (row, i, columns) {
    libraryCount=libraryCount+1;
    row.number = +row.number // Convert this value to a number
    //console.log(count+" with UID "+row.uid+" "+row.number);
    libraryArray.push({'uid':row.uid,'libraryNumber':row.number})
    //console.log(poolArray[count-1].uid);
    return row
 })
// Read usernamesnode data
var usernamesnode = fs.readFileSync("usernamesnode.json");
var jsonUserNamesNodeContent = JSON.parse(usernamesnode); 
// Push UID & email to list/matchedArray
var contents = fs.readFileSync("users-30oct.json");
var jsonContent = JSON.parse(contents);
for( var item in jsonContent.users){
    matchedArray.push({'uid':jsonContent.users[item].localId,'email':jsonContent.users[item].email});
}
// Reads target UIDs & target Style numbers
var style2b_data = io.readDataSync('targetstyle.csv',function (row, i, columns) {
    var rand = getRandomInt(1,60);                          // Mylibrary variator
    style2bArray.push({'email':row.email,'styleNumber':row.number, 'libraryNumber':rand})
    return row
})

// Main() ---------------------------------------------------------------------------------------



// Functions()  ---------------------------------------------------------------------------------
function getNoOfDownloads(email){
    //console.log("Checking presence of "+email)
    for (item of matchedArray){
            if(item['email'] ||item['email'].toLowerCase() == email.toLowerCase()){
                //console.log("Got the bugger "+item['uid']);
            return item['uid'];
            }
            else {
                //console.log("Sorry not in here")
            return 0; 
            }
    }
return 0;
}

function addStylesAndLibrary(){
    //for(var i =0;i<style2bArray.length;i++){ //Use this in final code TODO
    for(var i =0;i<style2bArray.length;i++){
      var updates = {};
      console.log(style2bArray[i].email+" "+i);
    //   console.log(style2bArray[i].styleNumber);
    //   console.log(style2bArray[i].libraryNumber);
      var uid = getNoOfDownloads(style2bArray[i].email.toLowerCase()); //TODO
      if (uid==0){
          console.log("No proper UID found ");
        return 0;
        }
    //   console.log("For this UID "+uid);
      var ref = db.ref("usernames").child(uid) //TODO
      for(var j = 0; j < style2bArray[i].styleNumber; j++){ //TODO
        for(var m = 0; m < j; m++){
         
            var random = getRandomInt(0,styleArray.length);
            var randomStyleNodeUid = styleArray[random].uid;
            //console.log(randomStyleNodeUid);
            var obj = jsonUserNamesNodeContent[randomStyleNodeUid]['styletranfertool'];
            var array = Object.keys(jsonUserNamesNodeContent[randomStyleNodeUid]['styletranfertool'])
            var randomStyleNode = obj[array[getRandomInt(0,array.length)]]; 
        //    var randomStyleNode = getRandomNode(styleArray,'styletranfertool');
            //console.log(randomStyleNode); 
            updates['/styletranfertool/'+ref.push().key] = randomStyleNode; //TODO
        }
      for(var k = 0;k < style2bArray[i].libraryNumber; k++){
            var randomLibraryNode = getRandomNode(libraryArray,'mylibrary');
        //  console.log(randomLibraryNode);
          updates['/mylibrary/'+ref.push().key] = randomLibraryNode; //TODO
            }
          ref.update(updates); //TODO
        }
    }
    console.log("Done")
}

function getRandomNode(arr,innerKey){
   var random = getRandomInt(0,arr.length);
   var randomNodeUid = arr[random].uid;
   //console.log("Node UID = " + randomNodeUid);
   var obj = jsonUserNamesNodeContent[randomNodeUid][innerKey];
   var array = Object.keys(obj)
   var randomNode = obj[array[getRandomInt(0,array.length)]];
   return randomNode;
}

function setNoOfDownloads(uid,target){
    for (var i=1;i<=target;i++){
    /* 
    var ref = db.ref();
    var animKey = "";
    animKey = ref.push().key;
    */
    console.log("pushed "+i+" times to "+uid);
    console.log(styleArray[Math.floor(Math.random()*styleArray.length)]);
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

//-------------------------------------------------------------------------------------------------

// ANIM upload

function uploadAnim(cellValue, inputTags, animKey, inputAnimName) {
    var tags = inputTags;
    var animName = inputAnimName;
    var animUrl = "";

    console.log("uploading ANIM " + inputTags);
    let bucket = storage.bucket(`${PROJECT_ID}.appspot.com`)
    bucket.upload(`anim files/${tags}.anim`, { destination: `animFiles/${tags}.anim` }, (err, file) => {
        if (err) { return console.error(err); }
        animUrl = `https://firebasestorage.googleapis.com/v0/b/${PROJECT_ID}.appspot.com/o/${file.metadata.name}?alt=media`;

        //Firebase name & URL update
        var ref = db.ref();
        var nameRef = db.ref("animations/" + animKey + "/name/");
        nameRef.set(animName);
        var animRef = db.ref("animations/" + animKey + "/animUrl/");
        animRef.set(animUrl);

    });
};

// MP4 upload

function uploadMp4(cellValue, inputTags, animKey, inputAnimName) {
    var tags = inputTags;
    var animName = inputAnimName;
    var mp4Url = "";

    console.log("uploading MP4 " + inputTags);
    let bucket = storage.bucket(`${PROJECT_ID}.appspot.com`)
    bucket.upload(`mp4 files/${tags}.mp4`, { destination: `mp4Files/${tags}.mp4` }, (err, file) => {
        if (err) { return console.error(err); }
        mp4Url = `https://firebasestorage.googleapis.com/v0/b/${PROJECT_ID}.appspot.com/o/${file.metadata.name}?alt=media`;

        //Firebase name & URL update
        var ref = db.ref("animations/" + animKey + "/mp4Url/");
        ref.set(mp4Url);

    });
};

// JSON upload

function uploadJson(cellValue, inputTags, animKey, inputAnimName) {
    var tags = inputTags;
    var animName = inputAnimName;
    var jsonUrl = "";

    console.log("uploading JSON " + inputTags);
    let bucket = storage.bucket(`${PROJECT_ID}.appspot.com`)
    bucket.upload(`json files/${tags}.json`, { destination: `jsonFiles/${tags}.json` }, (err, file) => {
        if (err) { return console.error(err); }
        jsonUrl = `https://firebasestorage.googleapis.com/v0/b/${PROJECT_ID}.appspot.com/o/${file.metadata.name}?alt=media`;

        //Firebase name & URL update
        var ref = db.ref("animations/" + animKey + "/jsonUrl/");
        ref.set(jsonUrl);

    });
};

// YAML upload

function uploadYaml(cellValue, inputTags, animKey, inputAnimName) {
    var tags = inputTags;
    var animName = inputAnimName;
    var yamlUrl = "";

    console.log("uploading YAML " + inputTags);
    let bucket = storage.bucket(`${PROJECT_ID}.appspot.com`)
    bucket.upload(`yaml files/${tags}.anim`, { destination: `yamlFiles/${tags}.anim` }, (err, file) => {
        if (err) { return console.error(err); }
        yamlUrl = `https://firebasestorage.googleapis.com/v0/b/${PROJECT_ID}.appspot.com/o/${file.metadata.name}?alt=media`;

        //Firebase name & URL update
        var ref = db.ref("animations/" + animKey + "/yamlUrl/");
        ref.set(yamlUrl);

    });
};

function uploadDuration(cellValue, inputTags, inputAnimKey, inputAnimName) {
    var tags = inputTags;
    var animName = inputAnimName;

    var animKey = inputAnimKey;

    console.log("uploading Duration " + inputTags);
    console.log("inside duration");
    //Duration update
    var durationRef = db.ref("animations/" + animKey + "/duration/");
    durationRef.set(tags);
    console.log("exiting duration");
};

/*
v {
var Excel = require('exceljs');
var filename = "animation classification-new.xlsx";
var workbook = new Excel.Workbook();
workbook.xlsx.readFile(filename)
    .then(function() {

        // use workbook
        var worksheet = workbook.getWorksheet(1);

        worksheet.eachRow(function(row, rowNumber) {
            var ref = db.ref();
            var animKey = "";
            animKey = ref.push().key;
            // console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.getCell(2).value));
            row.eachCell(function(cell, colNumber) {

                if (rowNumber != 1) {
             
                    if (colNumber == 8) {
                        var letter = (colNumber + 9).toString(36).toUpperCase();
                        letter = `${letter}${rowNumber}`;
                        var cellValue = worksheet.getCell(letter).value;
                        console.log(' ');
                        console.log('Column Name >>' + cellValue);
                        uploadDuration(cellValue, cellValue, animKey, cellValue);
                    } else {
                        var csvtest = new CSV(cell.value);
                        console.log(csvtest);


                        csvtest.forEach(function(element) {

                            var animName = "";
                            var animUrl = "";
                            var mp4Url = "";
                            var yamlUrl = "";
                            var jsonURL = "";
                            var letter = (colNumber + 9).toString(36).toUpperCase();
                            letter = `${letter}1`;
                            var cellValue = worksheet.getCell(letter).value;


                            console.log(' ');
                            console.log('Column Name >>' + cellValue);
                            console.log(element.length);
                            element.forEach(function(tags) {
                                console.log('Column Value>> ' + tags);
                            
                                if (cellValue == "name") {
                                    console.log("got a name AKA update urls/tags");
                                    animName = tags;
                                    uploadAnim(cellValue, tags, animKey, animName);
                                    uploadMp4(cellValue, tags, animKey, animName);
                                    uploadJson(cellValue, tags, animKey, animName);
                                    uploadYaml(cellValue, tags, animKey, animName);
                                    return;
                                }
                                // Push all other columns/tags to firebase/tags & save them under the tagsList.
                                var updatedAnimData = {};
                                //updatedAnimData["tagsList/" + tags] = animKey;
                                ref.child("tagsList/" + tags).push(animKey);

                                updatedAnimData["animations/" + animKey + "/tags/" + tags] = true;

                                ref.update(updatedAnimData, function(error) {
                                    if (error) {
                                        console.log("Error updating data:", error);
                                    }
                                });

                                console.log(' ');

                            });
                        }, this);
                    }
                    console.log('Row ' + rowNumber + ' ColNumber ' + colNumber + ' = ' + cell.value);
                }
            });
        });
    });

    */
/*
//Worksheet snippet

var worksheet = workbook.getWorksheet(1);

        worksheet.eachRow(function(row, rowNumber) {
        console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.getCell(2).value));
        });
        
row.eachCell(function(cell, colNumber) {
    console.log('Cell ' + colNumber + ' = ' + cell.value);
});

//File read

var filesArray = readDir.readSync('anim files/', ['**.anim'], readDir.ABSOLUTE_PATHS);
console.log(filesArray.length);

filesArray.forEach(function(file) {
    var name = file;
    var extension = path.extname(name);
    name = path.basename(name, extension);
    var mp4File = name + '.mp4';

    //console.log(name);
    //console.log(file);
}, this);

//Firebase key snippet

 const dbRef = db.ref('animations/');
                                // var newKey = dbRef.push().key;
                                // console.log('my new shiny id is ' + newKey);

// Firebase update snippet
function writeNewPost(uid, username, picture, title, body) {
  // A post entry.
  var postData = {
    author: username,
    uid: uid,
    body: body,
    title: title,
    starCount: 0,
    authorPic: picture
  };

  // Get a key for a new Post.
  var newPostKey = firebase.database().ref().child('posts').push().key;

  // Write the new post's data simultaneously in the posts list and the user's post list.
  var updates = {};
  updates['/posts/' + newPostKey] = postData;
  updates['/user-posts/' + uid + '/' + newPostKey] = postData;

  return firebase.database().ref().update(updates);
}                               
// jsonfile.readFile(file, function(err, obj) {
//   console.dir(obj[1])
// });
}
//console.log(poolArray[Math.floor(Math.random()*poolArray.length)]);
var json_data = io.readJson('users-30oct.json',function (row, i) {
    count2=count2+1;
    //conosle.log(count2+" "+row.users[0])
    return row
  },function (err, data) {
   //console.log(data.users[1]) 
   for( var item in data.users){
   console.log(item.email)
//    matchedArray.push({'uid':data.users[count2].localId,'email':data.users[count2].email})
matchedArray.push({'uid':item.localId,'email':item.email})}

   count2=count2+1;
 })
 //console.log(item['email'])
//setNoOfDownloads("1ewdtrdwtr1",4);
//getNoOfDownloads("dohou.michael@gmail.com");
*/