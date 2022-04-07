

const mongoose = require('mongoose')

const isVaild = (value)=>{
    if(typeof value === 'undefined' || typeof value === null) return false
    if(typeof value === 'String' ||  value.trim().length === 0)return false
    return true;
}
const isValidRequestBody = RequestBody => {
    return Object.keys(RequestBody).length > 0 ; };

   


module.exports = {
    isVaild,
    isValidRequestBody,
   
}