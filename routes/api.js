/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DB;

module.exports = function (app) {

      app.route('/api/issues/:project')

      .get(function (req, res){
        var project = req.params.project;
        console.log("GET", project);
        var searchQuery = req.query;
        if (searchQuery._id) searchQuery._id = ObjectId(searchQuery._id);
        if (searchQuery.open) searchQuery.open = String(searchQuery.open) == 'true';
        MongoClient.connect(CONNECTION_STRING, function(err, client) {
          if (err) {
            console.log('Database err', + err);
          } else {
            console.log('Successful database connection');
            let database = client.db("test");
            var collection = database.collection(project);
            collection.find(searchQuery).toArray((err, docs) => {
              res.json(docs);
            });
          }
        })
      })

      .post(function (req, res){
        var project = req.params.project;
        var issue = {
          issue_title: req.body.issue_title,
          issue_text: req.body.issue_text,
          created_on: new Date(),
          updated_on: new Date(),
          created_by: req.body.created_by,
          assigned_to: req.body.assigned_to || '',
          open: true,
          status_text: req.body.status_text || ''
        };
        if(!issue.issue_title || !issue.issue_text || !issue.created_by) {
          res.send('missing inputs');
        } else {
          MongoClient.connect(CONNECTION_STRING, function(err, client) {
            if (err) {
              console.log('Database err', + err);
            } else {
              console.log('Successful database connection');
              let database = client.db("test");
              var collection = database.collection(project);
              collection.insertOne(issue, (err, doc) => {
                issue._id = doc.insertedId;
                res.json(issue);
              })
            }
          })
        }
      })
      .put(function (req, res){
        var project = req.params.project;
        let issueId = req.body._id;
        delete req.body._id;
        let updates = req.body;
        for (var el in updates) {
          if (!updates[el])
            delete updates[el];
        }
        if (updates.open) {
          updates.open = String(updates['open']) == 'true';
        }
        if (Object.keys(updates).length === 0) {
          res.send('no updated field sent');
        } else {
          MongoClient.connect(CONNECTION_STRING, function(err, client) {
            if (err) {
              console.log('Database err', + err);
            } else {
              console.log('Successful database connection');
              updates.updated_on = new Date();
              let database = client.db("test");
              var collection = database.collection(project);
              collection.findAndModify({_id:new ObjectId(issueId)},
                                       [['_id',1]],
                                       {$set: updates},
                                       {new: true},
                                       function(err,doc){
                            if (err) {
                              res.send("could not update" + issueId + ' ' + err);
                            } else {
                              res.send('successfully updated');
                            }
                          });
            }
          })
        }
      })

       .delete(function (req, res){
        var project = req.params.project;
        let issueId = req.body._id;
        console.log("ID", issueId);
        if (!issueId) {
          res.send('_id error');
        } else {
          MongoClient.connect(CONNECTION_STRING, function(err, client) {
            if (err) {
              console.log('Database err', + err);
            } else {
              console.log('Successful database connection');
              let database = client.db("test");
              var collection = database.collection(project);
              collection.findAndRemove({_id:new ObjectId(issueId)}, (err, data) => {
                if (err) {
                  res.send('could not delete ' + issueId);
                } else {
                  res.send('deleted ' + issueId);
                }
              });
            }
          })
        }
      });
  //   }
  // })
};
