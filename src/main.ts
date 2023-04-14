import { logError } from "./debug.js";
import * as util from "./util.js";

//const config = util.GetConfig();

try{
    util.CacheCTR();
}
catch(err){
    logError(err);
}
