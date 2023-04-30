import * as fs from "fs";
import { LoadCTR, CTR, DownloadRawData, CheckAndCreate } from "./util.js";



export async function DownloadAllData(): Promise<void> {
    ['class','teacher','room'].map((path) => CheckAndCreate(`./cache/${path}`));
    
    console.time('download-all-raw-data');
    const ctrData = LoadCTR();
    await Promise.all(
        [CTR.Class,CTR.Teacher,CTR.Room].map((ctr: CTR) => {
            return ctrData[['class','teacher','room'][ctr.valueOf()]].map((pair: [string,string]) => {
                return DownloadRawData(ctr, pair[1]);
            });
        }).flat()
    );
    console.timeEnd('download-all-raw-data');
}

export async function GroupData() {
    const ctr = LoadCTR()
    let data: {[index: string]:any} = {
    };
    for (const pair of ctr['class']) {
        const cache = readCache(`class/${pair[1]}.json`);
        cache.forEach((cell: any) => {
            for (const prop in cell) {
                if(prop !== undefined){
                    if (!(prop in data)) {data[prop] = [];}
                    if (!(data[prop].includes(cell[prop]))) {data[prop].push(cell[prop]);}
                }
            }
        });
    }
    for (const pair of ctr['teacher']) {
        const cache = readCache(`teacher/${pair[1]}.json`);
        cache.forEach((cell: any) => {
            for (const prop in cell) {
                if(prop !== undefined){
                    if (!(prop in data)) {data[prop] = [];}
                    if (!(data[prop].includes(cell[prop]))) {data[prop].push(cell[prop]);}
                }
            }
        });
    }
    for (const pair of ctr['room']) {
        const cache = readCache(`room/${pair[1]}.json`);
        cache.forEach((cell: any) => {
            for (const prop in cell) {
                if(prop !== undefined){
                    if (!(prop in data)) {data[prop] = [];}
                    if (!(data[prop].includes(cell[prop]))) {data[prop].push(cell[prop]);}
                }
            }
        });
    }
    console.log("done");
    fs.writeFileSync(`cache/data.json`, JSON.stringify(data));
}

export async function GroupDataSplit() {
    const ctr = LoadCTR()
    let data: {[index: string]:any} = {
    };
    for (const pair of ctr['class']) {
        const cache = readCache(`class/${pair[1]}.json`);
        cache.forEach((cell: any) => {
            for (const prop in cell) {
                if(prop !== undefined){
                    if (!(prop in data)) {data[prop] = [];}
                    if (!(data[prop].includes(cell[prop]))) {data[prop].push(cell[prop]);}
                }
            }
        });
    }
    fs.writeFileSync(`cache/dataClass.json`, JSON.stringify(data));
    data = {};
    for (const pair of ctr['teacher']) {
        const cache = readCache(`teacher/${pair[1]}.json`);
        cache.forEach((cell: any) => {
            for (const prop in cell) {
                if(prop !== undefined){
                    if (!(prop in data)) {data[prop] = [];}
                    if (!(data[prop].includes(cell[prop]))) {data[prop].push(cell[prop]);}
                }
            }
        });
    }
    fs.writeFileSync(`cache/dataTeacher.json`, JSON.stringify(data));
    data = {};
    for (const pair of ctr['room']) {
        const cache = readCache(`room/${pair[1]}.json`);
        cache.forEach((cell: any) => {
            for (const prop in cell) {
                if(prop !== undefined){
                    if (!(prop in data)) {data[prop] = [];}
                    if (!(data[prop].includes(cell[prop]))) {data[prop].push(cell[prop]);}
                }
            }
        });
    }
    fs.writeFileSync(`cache/dataRoom.json`, JSON.stringify(data));
    
}

function readCache(path: string) {
    return JSON.parse(fs.readFileSync(`cache/${path}`,'utf-8'));
}



export type Data = {
    type: 'atom' | 'absent' | 'removed',
    subjecttext: string,        //      Anglický jazyk | út 11.4. | 3 (10:00 - 10:45)    čt 13.4. | 1 (8:05 - 8:50)
    teacher: string | null,     //      ?????? Teacher name, Teacher name again for some reason
    room: string,
    group: string,
    theme: string,
    notice: string,
    changeinfo: string,         
    homeworks: null,
    absencetext: null,
    hasAbsence: boolean,
    absentInfoText: '' | 'Absc | Obecná absence učitele' | 'SOUT | Učitel organizuje soutěž' | 'NEM | učitel je nemocen' | 'LÉK | u lékaře',
    absentinfo: '' | 'VŘŠ' | 'SAM' | 'AULA' | 'EXK' | 'Absc' | 'LÉK' | 'DOH' | 'SOUT' | 'UEX' | 'NEM',
    InfoAbsentName: null | 'volno ředitelky školy' | 'samostudium' | 'akce, beseda, přednáška v aule' | 'třída je na exkurzi' | 'Obecná absence učitele' |
        'u lékaře' | 'Učitel organizuje soutěž' | 'učitel je na exkurzi se třídou' | 'učitel je nemocen' | 'Obecná absence místnosti',
    removedinfo: string         
    //Spojení hodin: SUBJECT?new, TEACHER (TLY2(GROUP), SUBJECT?old)
    //Supluje: SUBJECT?new, TEACHER (CLASS, SUBJECT2?onld)    
    //Vyjmuto z rozvrhu (SUBJECT, TEACHER)
    //Vyjmuto z rozvrhu (CLASS, SUBJECT)   
    //Vyjmuto z rozvrhu (CLASS(GROUP), SUBJET)
    //Přesun na 14.4., 5. hod (SUBJECT, TEACHER)   
    //Přesun na 11.4., 4. hod (CLASS, SUBJECT)    
    //Zrušeno (SUBJECT, TEACHER)  
    //Zrušeno (CLASS, SUBJECT)
    //Absence třídy (CLASS, SUBJECT)   
}

export type Store = {
    type: 'atom' | 'absent' | 'removed'
    subjecttext?: string,
    teacher: string | null,
    room: string | null,
    group?: string,
    theme?: string,
    notice?: string
    
}