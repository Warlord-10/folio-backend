function generatePermission(userId, objectId){
    if (userId == objectId) {
        return "OWNER";
    }
    else{
        return "VISITOR";
    }
}

module.exports = {
    generatePermission
}