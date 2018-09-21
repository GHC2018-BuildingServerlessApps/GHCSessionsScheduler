const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const IS_CORS = process.env.IS_CORS;
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = (event) => {
    if (event.httpMethod === 'OPTIONS') {
		return Promise.resolve(processResponse(IS_CORS));
	}
    
    let params = {
        TableName: TABLE_NAME
    }
    return dynamoDb.scan(params)
    .promise()
    .then(response => (processResponse(IS_CORS, response.Items)))
    .catch(err => {
        console.log(err);
        return processResponse(IS_CORS, 'dynamo-error', 500);
    });
};

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