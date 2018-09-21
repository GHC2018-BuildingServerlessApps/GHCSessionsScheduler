const AWS = require('aws-sdk'),
    dynamoDb = new AWS.DynamoDB.DocumentClient(),
    IS_CORS = process.env.IS_CORS,
    TABLE_NAME = process.env.TABLE_NAME,
    PRIMARY_KEY = "id";


Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

exports.handler = (event, context, callback) => {
    var updatedIds = [];
    if (event.httpMethod === 'OPTIONS') {
		return Promise.resolve(processResponse(IS_CORS));
	}
    if (!event.body) {
        return Promise.resolve(processResponse(IS_CORS, 'no body arguments provided', 400));
    }
    const editedItemId = parseInt(event.pathParameters.id);
    if (!editedItemId) {
        return Promise.resolve(processResponse(IS_CORS, 'invalid id specified', 400));
    }

    const editedItem = JSON.parse(event.body);
    const editedItemProperties = Object.keys(editedItem);
    if (!editedItem || editedItemProperties.length < 1) {
        return Promise.resolve(processResponse(IS_CORS, 'no args provided', 400));
    }
    
    const key = {};
    key[PRIMARY_KEY] = editedItemId;
    const firstProperty = editedItemProperties.splice(0,1);
    
    let params = {
        TableName: TABLE_NAME,
        Key: key,
        UpdateExpression: `set ${firstProperty} = :${firstProperty}`,
        ExpressionAttributeValues: {},
        ReturnValues: 'ALL_NEW'
    }
    params.ExpressionAttributeValues[`:${firstProperty}`] = editedItem[firstProperty];

    editedItemProperties.forEach(property => {
        params.UpdateExpression += `, ${property} = :${property}`;
        params.ExpressionAttributeValues[`:${property}`] = editedItem[property];
    });
    
    dynamoDb.update(params)
    .promise()
    .then(function(updated)  {
        //if the property that was updated was not isSelected, we can return
        const importantProperty = "isSelected";
        if (!Object.keys(editedItem).includes(importantProperty)) {
            callback(null, processResponse(IS_CORS, updated["Attributes"]["id"]));
        }
        performPostUpdateActions(updated, importantProperty, updatedIds, context);
        
    })
    .catch(dbError => {
        let errorResponse = `Error: Execution update, caused a Dynamodb error, please look at your logs.`;
        if (dbError.code === 'ValidationException') {
            if (dbError.message.includes('reserved keyword')) errorResponse = `Error: You're using AWS reserved keywords as attributes`;
        }
        console.log(dbError);
        return processResponse(IS_CORS, errorResponse, 500);
    });
    callback(null, processResponse(IS_CORS, "Success"));
};


function performPostUpdateActions(updated, importantProperty, updatedIds, context) {
    const updatedItem = updated["Attributes"]
    updatedIds.push(updatedItem["id"]);

    //Scan the index for the updated item's start date 
    //See if there are conflicts among those
    var get_conflicting_params = {
        TableName : TABLE_NAME,
        IndexName : "startDate-index",
        KeyConditionExpression: "#startDate = :v_start_date",
        ExpressionAttributeNames:{
            "#startDate": "startDate"
        },
        ExpressionAttributeValues: {
            ":v_start_date": updatedItem["startDate"]
        }
    };
    
    var conflictingSessionsToSet = [];
    var conflictingSessionsToUnset = [];
    dynamoDb.query(get_conflicting_params, function(err, data) {
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
        } else {
            if (updatedItem[importantProperty] == 1) {
                gatherConflictingSessions(data.Items, updatedItem, conflictingSessionsToSet);
                
                if (conflictingSessionsToSet.length == 0) {
                    context.succeed(processResponse(IS_CORS, "Success"));  
                }
                updateConflicts(conflictingSessionsToSet, 1, updatedIds, context);
                

            } else if (updatedItem[importantProperty] == 0) {
                data.Items.forEach(function(item) {
                    if(item[importantProperty] == 1) {
                        gatherConflictingSessions(data.Items, item, conflictingSessionsToSet);
                    }
                });
            
                data.Items.diff(conflictingSessionsToSet).forEach(function(session) { 
                    if (session["hasConflict"] == 1) {
                        conflictingSessionsToUnset.push(session);
                    }
                });
                if (conflictingSessionsToUnset.length == 0) {
                    return context.succeed(processResponse(IS_CORS, "Success"));  
                }
                updateConflicts(conflictingSessionsToUnset, 0, updatedIds, context);
            }
            console.log("Updated " + updatedIds.length + " item(s).");
        }
    });
}

function gatherConflictingSessions(items, updatedItem, conflictingSessionsToSet) {
    items.forEach(function(item) { 
        if(item["id"] != updatedItem["id"]) {  
            const updated_start_time = parseTime(updatedItem["startTime"]);
            const updated_end_time = parseTime(updatedItem["endTime"]);
            const item_start_time = parseTime(item["startTime"]);
            const item_end_time = parseTime(item["endTime"]);
            
            if ((item_start_time >= updated_start_time  && item_start_time < updated_end_time) || 
                (updated_end_time > item_start_time && updated_end_time <= item_end_time )) {
                if(item["hasConflict"] == 0) {
                    conflictingSessionsToSet.push(item);
                }
            }
        }
    });
}

function updateConflicts(items, hasConflict, updatedIds, context) {
    items.forEach(function(sess) {
        updatedIds.push(sess["id"]);
        const key = {};
        key[PRIMARY_KEY] = sess["id"];
        let params = {
            TableName: TABLE_NAME,
            Key: key,
            UpdateExpression: "set hasConflict = :c",
            ExpressionAttributeValues:{
                ":c": hasConflict
            },
            ReturnValues: 'ALL_NEW'
        }
        
        dynamoDb.update(params)
        .promise()
        .then(function(updated)  {
            //Success
        }) 
        .catch(dbError => {
            let errorResponse = `Error: Execution update, caused a Dynamodb error, please look at your logs.`;
            if (dbError.code === 'ValidationException') {
                if (dbError.message.includes('reserved keyword')) errorResponse = `Error: You're using AWS reserved keywords as attributes`;
            }
            console.log(dbError);
            return processResponse(IS_CORS, errorResponse, 500);
        });
        
    })
}

function parseTime(timeString) {
	if (timeString == '') return null;
	
	var time = timeString.match(/(\d+)(:(\d\d))?\s*(p?)/i);	
	if (time == null) return null;
	
	var hours = parseInt(time[1],10);	 
	if (hours == 12 && !time[4]) {
		  hours = 0;
	}
	else {
		hours += (hours < 12 && time[4])? 12 : 0;
	}	
	var d = new Date();  	    	
	d.setHours(hours);
	d.setMinutes(parseInt(time[3],10) || 0);
	d.setSeconds(0, 0);	 
	return d;
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