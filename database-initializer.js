
/***************************************************/
/* This is the database-initializer.js             */
/* which initialize the a4 database                */
/***************************************************/


let userNames = ["winnifred", "lorene", "cyril", "vella", "erich", "pedro", "madaline", "leoma", "merrill",  "jacquie"];
let users = [];

userNames.forEach(name =>{
	let u = {};
	u.username = name;
	u.password = name;
	u.privacy = false;
	users.push(u);
});

let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
let db;

MongoClient.connect("mongodb://127.0.0.1:27017/", { useNewUrlParser: true },  function(err, client) {
  if(err) throw err;

  db = client.db('myorderingsystem');

  db.listCollections().toArray(function(err, result){
	 if(result.length == 0){
		 db.collection("users").insertMany(users, function(err, result){
			if(err){
				throw err;
			}

			console.log(result.insertedCount + " users successfully added (should be 10).");
			client.close();
		});
		return;
	 }

	 let numDropped = 0;
	 let toDrop = result.length;
	 result.forEach(collection => {
		db.collection(collection.name).drop(function(err, delOK){
			if(err){
				throw err;
			}

			console.log("Dropped collection: " + collection.name);
			numDropped++;

			if(numDropped == toDrop){
				db.collection("users").insertMany(users, function(err, result){
					if(err){
						throw err;
					}

					console.log(result.insertedCount + " users successfully added (should be 10).");
					client.close();
				});
			}
		});
	 });
  });
});
