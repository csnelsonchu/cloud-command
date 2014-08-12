var rewire = require("rewire");

describe("AwsUtility.download" , function (){
        it("should be able to create local temp path and download file",function() {
            console.log('\r\n---Test AwsUtility.download starts----------------');
            //Assign
            var awsUtil = rewire("../command_modules/aws-util.js");
            var expected = '../myDownload/out.png';
            var request = {'bucket':'someBucket','key':'SomeKey.png','destinationPath':'../myDownload/out.png'};
            var actual;
            var completed = false;
            awsUtil.__set__("local", {
                    getObject: function (request,callback) {
                                console.log('mocked local getObject function');
                                console.log(request);
                                callback(null,null);
                                    }
            });
            
            //Action
            awsUtil.download(request, function(err,results){
                completed = true;
                if(err){
                console.log('Error:'+err);
                }
                else
                {
                actual = results;
                }
                });
                
            //Assert
            waitsFor(function(){
                return completed;
            },"callback returned",100);

            runs(function()
            {
                console.log('assert');
                expect(actual).toBe(expected);    
                console.log('---Test Ends----------------');
            });
        });
});

describe("AwsUtility.upload" , function (){
        it("should be able to read source path and upload file",function() {
            console.log('\r\n---Test AwsUtility.upload starts----------------');
            //Assign
            var awsUtil = rewire("../command_modules/aws-util.js");
            var expected = '../myDownload/';
            var request = {'bucket':'someBucket','key':'SomeKey.png','sourcePath':'../myDownload/'};
            var actual;
            var completed = false;
            var mockData = 'data';
            awsUtil.__set__("local", {
                    putObject: function (request,callback) {
                                console.log('mocked local putObject function');
                                if(request.data != mockData) throw new Error('Mock Data Error');
                                callback(null,null);
                                    }
            });
            awsUtil.__set__('fs',{ 
                readFile:function(path,callback){
                    callback(null,mockData); 
                }
            });
            
            //Action
            awsUtil.upload(request, function(err,results){
                completed = true;
                if(err){
                console.log('Error:'+err);
                }
                else
                {
                actual = results;
                }
                });
                
            //Assert
            waitsFor(function(){
                return completed;
            },"callback returned",100);

            runs(function()
            {
                console.log('assert');
                expect(actual.bucket).toBe(request.bucket);    
                expect(actual.key).toBe(request.key);    
                console.log('---Test Ends----------------');
            });
        });
});
