const requestify = require('requestify');

console.log('i am pinger');
requestify.get(process.env.URL).then(function(response) {
    console.log('resp gb: ', response.getBody());
    console.log('resp: ',response);
    process.exit()
});
