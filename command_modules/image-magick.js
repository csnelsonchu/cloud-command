/**
 * Created by nchu on 1/29/14.
 */

var noop = function(){};
var awsUtil = require('../command_modules/aws-util.js');
var path = require('path');
var child_process = require('child_process');
var fs = require('fs');
var mkdirp = require('mkdirp');
var guid = require('guid');
var aws = require('aws-sdk');;
var _ = require('underscore');
var _s = require('underscore.string');
var util = require('util');
var logger = {};
logger.log = function(message){
    if(typeof(message) =='object')
    {
        console.log(util.inspect(message));
    }
    else console.log(message);
};
var local =
{
    mkdirp: function(request, callback){mkdirp(request,callback);}
}
function getCommand(request,callback){

    logger.log('ImageMagick.getCommand Starts');
    logger.log(request);
    callback = (callback || noop);
    var response = {};
    var appDir = path.dirname(require.main.filename).replace(/\\/g, '/');
    var input = '';
    var output = '';
    if(typeof request.command === 'undefined'){throw new Error("command is undefined");} 
    if(typeof request.toKey === 'undefined' || typeof request.toBucket === 'undefined' ||request.toKey == '' || request.toBucket == '')
    {
        throw new Error("Destination Bucket and Key was not defined");
    }
    if(request.fromKey != '' && request.fromBucket != '')
    {
        var uploadObjectPath = guid.create()+'/'+request.toKey;
        var localFileName = guid.create() + '.' + _.last(_s.words(request.fromKey,'.'));
        var inLocalPath = appDir+'/s3/'+request.fromBucket+'/'+_.first(_s.words(request.fromKey,'.'))+'/';
        input = String(inLocalPath + localFileName);
    }
    var outLocalPath = appDir+'/s3/'+ request.toBucket+'/'+guid.create()+'/';
    output = String(outLocalPath + request.toKey);
    var command = String(request.command).replace('{input}',input).replace('{output}',output); 
    response.command = command;
    response.sourcePath = input;
    response.destinationPath = output;
    logger.log('getCommand ends');
    logger.log(response);
    callback(null,response);
    return (this);
};
function cleanLocalPath(localPath,callback){
    var command = 'find ' + localPath + ' -type f -mtime +2 -delete';
    logger.log('cleanLocalPath will execute '+command);
    child_process.exec(command, function(err,stdout, stderr){
        logger.log(err);
        if(err){throw new Error('Error in cleanLocalPath'+err)};
    });
};
function execute(req,res,next){
    logger.log('ImageMagick.Execute Starts-----------------------------');
    logger.log(req);
    var response = {};
    var cmd = {};
    cmd.fromBucket = req.params.fromBucket;
    cmd.fromKey = req.params.fromKey;
    cmd.toBucket = req.params.toBucket;
    cmd.toKey = req.params.toKey;
    cmd.command = req.params.command;
    cmd.acl = req.params.acl;
    var appDir = path.dirname(require.main.filename).replace(/\\/g, '/');
    cleanLocalPath(appDir+'/s3/',null);
    getCommand(cmd,function(err,getCommandResponse)
            {
                var onExecuteReady = function()
    {
        logger.log('Running Command:' + getCommandResponse.command);
        local.mkdirp(path.dirname(getCommandResponse.destinationPath), function(err){
            if(err){throw new Error('Error in creating destination directory:'+err)}
            child_process.exec(getCommandResponse.command, function(err,stdout, stderr){
                logger.log(err);
                if(err){throw new Error('Error in runCommand'+err)};
                logger.log('process upload');
                var uploadRequest = {'bucket':cmd.toBucket, 'key':cmd.toKey, 'sourcePath':getCommandResponse.destinationPath, 'acl':cmd.acl};
                logger.log(uploadRequest);
                awsUtil.upload(uploadRequest,function(err,results){
                    if(err){throw new Error('Error in Upload'+err);}
                    logger.log('ImageMagick.execute Ends-------------------------------------');
                    next(null,response);
                });
            });
        }); 
    }
    if(err){throw new Error('Error in getCommand' + err);}
    if(typeof cmd.fromBucket === 'undefined' || cmd.fromBucket == '' || typeof cmd.fromKey === 'undefined' || cmd.fromKey == '')
    {
        return onExecuteReady();
    }
    var downloadRequest = {'bucket':cmd.fromBucket,'key':cmd.fromKey,'destinationPath':getCommandResponse.sourcePath};
    awsUtil.download(downloadRequest, function(err,results){
        if(err){throw new Error('Error in awsUtil.download:' + err);}
        return onExecuteReady();
    });
            });
    response.bucketName = cmd.toBucket;
    response.keyName = cmd.toKey;
    res.send(response);
};
exports.getCommand = getCommand;
exports.execute = execute;
exports.convert = function convert(req, res, next) {
    var response = {};
    var cmd = {};
    logger.log(req);
    cmd.fromBucket = req.params.fromBucket;
    cmd.fromKey = req.params.fromKey;
    cmd.toBucket = req.params.toBucket;
    cmd.toKey = req.params.toKey;
    cmd.command = req.params.command;
    res.setHeader('Access-Control-Allow-Origin','*');
    var path = require('path');
    var appDir = path.dirname(require.main.filename).replace(/\\/g, '/');
    var fs = require('fs');
    var mkdirp = require('mkdirp');
    var guid = require('guid');
    var aws = require('aws-sdk');
    var _ = require('underscore');
    var uploadObjectPath = guid.create()+'/'+cmd.toKey;
    var localFileName = guid.create() + '.' + _.last(cmd.fromKey.split('.'));
    var inLocalPath = appDir+'/s3/'+cmd.fromBucket+'/';
    var outLocalPath = appDir+'/s3/'+ cmd.toBucket+'/'+guid.create()+'/';
    response.BucketName = cmd.toBucket;
    response.KeyName = uploadObjectPath;
    var commandLine= cmd.command.replace('{input}',inLocalPath+localFileName).replace('{output}',outLocalPath+cmd.toKey);
    aws.config.loadFromPath('./config.json');
    var s3 = new aws.S3();cmd.fromKey.split('.')
        mkdirp(inLocalPath, function (err) {
            if (err) {console.error(err);}
            else{
                var file = fs.createWriteStream(inLocalPath+localFileName);
                s3.getObject({Bucket: cmd.fromBucket, Key: cmd.fromKey}).
            on('httpData', function(chunk) { file.write(chunk); }).
            on('httpDone', function() { file.end();
                mkdirp(outLocalPath, function (err) {
                    if (err) {console.error(err);}
                    else {
                        var exec = require('child_process').exec;
                        exec(commandLine, convertCallback);
                        function convertCallback(error, stdout, stderr)
                {
                    fs.readFile(outLocalPath+cmd.toKey, function (err, data) {
                        if (err) { throw err; }
                        var s3bucket = new aws.S3({params: {Bucket: cmd.toBucket}});
                        s3bucket.createBucket(function() {
                            var putRequest = {Key: uploadObjectPath, Body: data};
                            s3bucket.putObject(putRequest, function(err, putRequest) {
                                if (err) {
                                    console.log("Error uploading data: ", err);
                                } else {
                                    console.log("Successfully uploaded data to "+response.BucketName+'/'+response.KeyName);
                                }
                            });
                        });
                    });
                }
                    }
                });
            }).
        send();
            }
        });
    res.send(response);
};
