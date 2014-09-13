var express = require('express'),
    request = require('request'),
    cheerio = require('cheerio'),
    redis   = require('redis'),
    twilio  = require('twilio'),
    tclient = new twilio.RestClient(
        process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN),
    recipients = process.env.RECIPIENTS.split(','),
    from = process.env.TWILIO_FROM,
    redisURL = url.parse(process.env.REDISCLOUD_URL),
    rclient = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true}),
    rclient.auth(redisURL.auth.split(':')[1]),
    app     = express();

app.set('port', (process.env.PORT || 5000))

app.get('/check', function(req, res){
    url = 'http://www.bitsundso.de/400/';

    request(url, function(error, response, html){
        if(!error){
            var $ = cheerio.load(html);

            $('.post').filter(function(){
                var data = $(this).html();
                rclient.get('bus400', function(err, data2) {
                    if(data2 != data) {
                        console.log('something new!');
                        for (var i=0; i<recipients.length; i++) {
                            tclient.sms.messages.create({
                                to: recipients[i],
                                from: from,
                                body: 'Es gibt eine Änderung auf http://www.bitsundso.de/400/!!'
                            }, function(error, message) {
                                if (!error) {
                                    console.log('Message sent to', recipients[1], 'on', message.dateCreated);
                                } else {
                                    console.log('Oops! There was an error.', error);
                                }
                            });
                        }
                        rclient.set('bus400', data);
                    }
                });
            });
        }

        res.send('Done.');
    })
})

app.listen(app.get('port'))
console.log('Magic happens on port', app.get('port'));
exports = module.exports = app;
