var wkhtmltopdf = require('wkhtmltopdf');
var MemoryStream = require('memorystream');
var fs = require('fs');
var exec = require('child_process').exec;
var uuidGenerator = require('node-uuid-generator');

process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];

exports.handler = function(event, context) {
	
	var memStream = new MemoryStream();
	var html_utf8 = new Buffer(event.html_base64, 'base64').toString('utf8');
	var fileName = uuidGenerator.generate();
	var filePath = '/tmp/' + fileName + '.pdf';
	var encryptedFilePath = '/tmp/' + fileName + '_enc.pdf';
	wkhtmltopdf(html_utf8, event.options, function(err) { 
		if(err){
			console.log(err);
		}
				
		var pdf_generated = new Buffer(memStream.read().toString('base64'), 'base64');			
		
		fs.writeFile(filePath, pdf_generated, function(err){	
			exec('pdftk ' + filePath + ' output ' + encryptedFilePath + ' user_pw ' + event.encrypt_options.userpassword + ' allow printing', function(err, stdout, sterr){
				if(err){
					console.log(err);
				}
				var pdfMemStream = new MemoryStream();
				var readFile = fs.createReadStream(encryptedFilePath);			
				readFile.on('end', function() {
					context.done(null, { pdf_base64: pdfMemStream.read().toString('base64') }); 			
				});						
				readFile.pipe(pdfMemStream);
			});						
		});		
	}).pipe(memStream);	
};