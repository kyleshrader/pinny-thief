var request = require('request');

request
    .get('https://www.pinnypals.com/scripts/queryPins.php')
    .on('response', (response) => {
        console.log(response.statusCode);
    });