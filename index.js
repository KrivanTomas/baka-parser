import { got } from 'got';
import * as cheerio from 'cheerio';
import * as fs from 'fs';


const LoadData = async () => {
    try {
        const url = `https://bakalari.spst.cz/Timetable/Public/Actual/Class/7D`;
        const res = got(url);
        const data = await res;
        return cheerio.load(data.body);
    }
    catch(err){
        console.log(err);
    }
};

const LoadDataFrom = async (addUrl) => {
    try {
        const url = `https://bakalari.spst.cz/Timetable/Public/${addUrl}`;
        const res = got(url);
        const data = await res;
        return cheerio.load(data.body);
    }
    catch(err){
        console.log(err);
    }
};

const cacheLongtime = async () => {
    console.log('-=-=-=-=-=-Caching longtime-=-=-=-=-=-')
    const $ = await LoadData();
    let classes = [], teachers = [], rooms = [];
    try{ // CLASSES
        $('option', '#selectedClass').each((i, elem) => { classes[i] = [elem.attribs['value'], $(elem).text().replace(/\s+/g, '')]; });
        classes = classes.slice(1);
        console.log('Cached ' + classes.length.toString() + ' classes');
    } catch(err){ console.log(err); }

    try{ // TEACHERS
        $('option', '#selectedTeacher').each((i, elem) => { teachers[i] = [elem.attribs['value'], $(elem).text().replace(/\s{2,}/g, '')]; });
        teachers = teachers.slice(1);
        console.log('Cached ' + teachers.length.toString() + ' teachers');
    } catch(err){ console.log(err); }
    
    try{ // ROOMS
        $('option', '#selectedRoom').each((i, elem) => { rooms[i] = [elem.attribs['value'], $(elem).text().replace(/\s+/g, '')]; });
        rooms = rooms.slice(1);
        console.log('Cached ' + rooms.length.toString() + ' rooms');
    } catch(err){ console.log(err); }

    try{ // cache into a .json file
        if(!fs.existsSync('cache')) fs.mkdirSync('cache');
        let ctrInfo = JSON.stringify({ classes: classes, teachers: teachers, rooms: rooms});
        fs.writeFileSync("cache/longtime.json", ctrInfo);
        console.log('✔ Cached and saved to file ✔');
    } catch(err){ console.log(err); }
};

const getLongtimeCache = () => {
    const data = fs.readFileSync('cache/longtime.json', 'utf8');
    return JSON.parse(data);
};





// something 🔥🔥 (not lit but on fire)

await cacheLongtime();
const longtime = getLongtimeCache();
let clas = longtime['classes'].filter((x) => {return x[1] == 'TLA3'})[0];
console.log(clas);
const $ = await LoadDataFrom('Actual/Class/' + clas[0]);


let hodiny = [];
const actualDate = new Date();


$('.day-item-hover').each((i, elem) => {
    hodiny[i] = JSON.parse(elem.attribs['data-detail']);

    let stuff = hodiny[i]['subjecttext'].match(/\d{1,2}/g);
    hodiny[i]['time'] = [
        new Date(
        Date.parse(
            actualDate.getFullYear().toString() + '-' +
            stuff[1].toString() + '-' +
            stuff[0].toString() + 'T' +
            (stuff[3] < 10 ? '0' : '' ) + stuff[3].toString() + ':' + stuff[4].toString() + ':00.000Z')
        ),
        new Date(
        Date.parse(
            actualDate.getFullYear().toString() + '-' +
            stuff[1].toString() + '-' +
            stuff[0].toString() + 'T' +
            (stuff[5] < 10 ? '0' : '' ) + stuff[5].toString() + ':' + stuff[6].toString() + ':00.000Z')
        )
    ];
})



//console.log(hodiny);

let todayHodiny = [];

todayHodiny = hodiny.filter((value, index, array) => {
    if(value['time'][0].getDate() == actualDate.getDate()) {
        return true;
    }
    return false;
});

//console.log(todayHodiny);

