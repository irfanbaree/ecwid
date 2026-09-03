const orders = require("./orders");

exports.configure = function (app) {
    app.use("/api/orders", orders);
};