"use strict";
var request = require('request');
var fs = require('fs');
var _ = require('underscore');
var download = function (uri, filename, callback) {
    request.head(uri, function (err, res, body) {
        console.log('content-type:', res.headers['content-type']);
        console.log('content-length:', res.headers['content-length']);
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};
var pinJson = {};
var data = {};
request('https://www.pinnypals.com/scripts/queryPins.php', function (err, res, body) {
    data = JSON.parse(body);
    pinJson = data.pins.map(function (p) {
        var pin = new Pin();
        pin.id = p.id;
        pin.name = p.name;
        pin.sets = [];
        if (p.year) {
            pin.sets.push(p.year);
        }
        if (p.pax_id) {
            var pax = data.paxs.find(function (pax) { return pax.id == p.pax_id; });
            pin.sets.push(pax.name.toUpperCase());
        }
        if (p.set_id) {
            var set = data.sets.find(function (set) { return set.id == p.set_id; });
            pin.sets.push(set.name.toUpperCase());
            pin.sets.push(set.year);
        }
        if (p.sub_set_id) {
            var altset_1 = data.altSets.find(function (set) { return set.parent_id == p.sub_set_id; });
            var set = data.sets.find(function (set) { return set.id == altset_1.alternate_id; });
            pin.sets.push(set.name.toUpperCase());
            pin.sets.push(set.year);
        }
        if (p.image_name) {
            pin.thumb = p.image_name.replace(/\?\d+$/, '');
        }
        if (pin.sets) {
            pin.sets = _.unique(pin.sets);
        }
        pin.reprint = (p.alternate == "Y") ? true : false;
        pin.qty = 0;
        return pin;
    });
    fs.writeFile('./pins.json', JSON.stringify(pinJson, null, '\t'), function (err) {
        if (err)
            console.log(err.message);
    });
    //fs.mkdir('./images');
    pinJson.forEach(function (pin) {
        var uri = 'https://www.pinnypals.com/imgs/' + pin.thumb;
        var filename = './images/' + pin.thumb;
        request.head(uri, function (err, res, body) {
            request(uri).pipe(fs.createWriteStream(filename)).on('close', function () { });
        });
    });
});
;
var Pin = (function () {
    function Pin() {
    }
    return Pin;
}());
exports.Pin = Pin;
