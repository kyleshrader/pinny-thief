import * as request from 'request';
import * as fs from 'fs';
import * as _ from 'underscore';

var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

var pinJson: any = {};
var data: any = {};
request('https://www.pinnypals.com/scripts/queryPins.php', (err, res, body) => {
    data = JSON.parse(body);
    pinJson = data.pins.map((p) => {
        var pin: Pin = new Pin();
        pin.id = p.id;
        pin.name = p.name;
        pin.sets = [];

        if(p.year) {
            pin.sets.push(p.year);
        }
        
        if(p.pax_id) {
            let pax = data.paxs.find((pax) => {return pax.id == p.pax_id;});
            pin.sets.push(pax.name.toUpperCase());
        }

        if(p.set_id) {
            let set = data.sets.find((set) => {return set.id == p.set_id;});
            pin.sets.push(set.name.toUpperCase());
            pin.sets.push(set.year);
        }

        if(p.sub_set_id) {
            let altset = data.altSets.find((set) => {return set.parent_id == p.sub_set_id;});
            let set = data.sets.find((set) => {return set.id == altset.alternate_id});
            pin.sets.push(set.name.toUpperCase());
            pin.sets.push(set.year);
        }

        if(p.image_name) {
            pin.thumb = p.image_name.replace(/\?\d+$/, '');
        }

        if(pin.sets) {
            pin.sets = _.unique(pin.sets);
        }

        pin.reprint = (p.alternate == "Y") ? true : false;

        pin.qty = 0;

        return pin;
    }).reverse();

    fs.writeFile('./pins.json', JSON.stringify(pinJson, null, '\t'), (err) => {
        if(err) console.log(err.message);
    });

    //fs.mkdir('./images');
    pinJson.forEach((pin) => {

        var uri: string = 'https://www.pinnypals.com/imgs/'+pin.thumb;
        var filename: string = './images/' + pin.thumb;
        request.head(uri, function(err, res, body){
            request(uri).pipe(fs.createWriteStream(filename)).on('close', () => {}));
        });
    });
});

export class Pin {
    id: string;
    name: string;
    sets: string[];
    thumb: string;
    reprint: boolean;
    qty: number;
}
