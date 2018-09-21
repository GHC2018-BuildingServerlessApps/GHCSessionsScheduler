const AWS = require('aws-sdk'),
    dynamoDb = new AWS.DynamoDB.DocumentClient(),
    IS_CORS = process.env.IS_CORS,
    TABLE_NAME = process.env.TABLE_NAME;

exports.handler = (event, context, callback)  => {
    var fs = require('fs');
    var sessions = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    
    var arrayOfArrays = chunkArray(sessions, 25);
    arrayOfArrays.forEach(function(array) {
        batchWriteSessionsToTable(array);
    });
    callback(null, processResponse(IS_CORS, "Success"));
};

function batchWriteSessionsToTable(sessions) {
    var i;
    var completed = [];
    for (i = 0; i < sessions.length; i++) {
        var someItem = sessions[i];
        var item = {
            PutRequest: {
                Item: someItem
            }
        };
        if (item) {
          completed.push(item);
        }
    }
    
    var params = {
      RequestItems: { 
        "GHCSessions": completed
      }
    };
    
    dynamoDb.batchWrite(params, function(err, data) {
      if (err) {
        console.log(err); 
      } 
      else  {
        //success
      }
    });
}

function chunkArray(myArray, chunk_size){
    var results = [];
    
    while (myArray.length) {
        results.push(myArray.splice(0, chunk_size));
    }
    
    return results;
}

function processResponse(isCors, body, statusCode) {
    const status = statusCode || (body ? 200 : 204);
    const headers = { 'Content-Type': 'application/json' };
    if (isCors) {
        Object.assign(headers, {
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'OPTIONS,PUT,POST',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Max-Age': '86400'
        });
    }
    return {
        statusCode: status,
        body: JSON.stringify(body) || '',
        headers: headers
    };
}