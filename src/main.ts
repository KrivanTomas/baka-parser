import * as util from "./util.js";
import * as analyze from "./analyse.js"
//import { logError } from "./debug.js";

//const config = util.GetConfig();


await util.CacheCTR();
await analyze.DownloadAllData();
await analyze.GroupDataSplit();

