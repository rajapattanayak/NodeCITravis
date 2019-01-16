const { clearHash } = require('../services/cache');

module.exports = async (req, res, next) => {
    // wait untill route handler is done. meaning
    // run middlewire logic after the processing of request is done
    // here we want to delete the cache after new blog is saved
    await next();

    clearHash(req.user.id);
}