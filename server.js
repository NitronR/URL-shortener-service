// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var mongodb = require('mongodb');
var url = "mongodb://"+process.env.USER+":"+process.env.PASS+"@ds161001.mlab.com:61001/fcc_projects";

var url_index=0;
function insert(_url,response){
  mongodb.MongoClient.connect(url, function(err, db) {
    var resp=null;
    
    if (err) throw err;
    var cursor=db.collection('url_short').find({"url":_url});
    cursor.hasNext(function(err,has){
      if(err) throw err;
      if(has){
        cursor.next(function(err,doc){
          if(err) throw err;
          resp={"original_url":doc.url,"short_url":"https://url-shortener-service.glitch.me/"+doc.short};
          response.send(resp);
          db.close();
        });
        }else{
          db.collection('url_short').find().count(function(err,c){
              if(err) throw err;
              url_index=c;
              resp={"url":_url,"short":url_index.toString()};
              db.collection('url_short').insertOne(resp, function(err, result) {
                if(err) throw err;
                response.send({"original_url":_url,"short_url":"https://url-shortener-service.glitch.me/"+url_index.toString()});
                db.close();
              });
          });
      }
    });
  });
}
app.use(express.static('public'));

app.get("/", function (request, response) {
  response.sendFile(__dirname+'/views/index.html');
});
app.get("/new/*", function (request, response) {
  var q=request.path.substring(5);
  var pattern=new RegExp(/https?:\/\/(.+\.)?.+\..+/);
  if(q.match(pattern)){
    insert(q,response);
  }else{
    response.send({"error":"Invalid URL"});
  }
});
app.get("/*", function (request, response) {
  var q=request.path.substring(1);
  mongodb.MongoClient.connect(url,function(err,db){
    var cursor=db.collection('url_short').find({"short":q});
    cursor.hasNext(function(err,r){
      if(err) throw err;
      if(r){
        cursor.next(function(err,doc){
        if(err) throw err;
          response.redirect(doc.url);
        });
      }else{
        response.send({"error":"Invalid short URL"});
      }
    });
    db.close();
  });
});
// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
