const { response } = require("express");
const { redirect } = require("express/lib/response");
const res = require("express/lib/response");
const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

/* Validators */
function validateOrderExists(request, response, next) {
    const { orderId } = request.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder) {
      response.locals.order = foundOrder;
      return next();
    }
    next({
      status: 404,
      message: `Order id does not exist: ${orderId}`,
    });
}

function validateOrderBody(request, response, next) {
    const { data: { deliverTo, mobileNumber, dishes } = {} } = request.body;
    // check if deliverTo property is missing or missing
    if (!deliverTo || deliverTo === "") {
      return next({ status: 400, message: "Order must include a deliverTo" });
    }
    // check if mobileNumber property is missing or empty
    if (!mobileNumber || mobileNumber === "") {
      return next({ status: 400, message: "Order must include a mobileNumber" });
    }
    // check if dishes property is missing
    if (!dishes) {
      return next({ status: 400, message: "Order must include at least one dish" });
    }
    // check if dishes property is not an array or empty
    if (!Array.isArray(dishes) || dishes.length === 0) {
      return next({
        status: 400,
        message: "Order must include at least one dish",
      });
    }
    // check if a dish quantity property is missing, zero or less, or not an integer
    dishes.map((dish, index) => {
      if (
          !dish.quantity ||
          !Number.isInteger(dish.quantity) ||
          !dish.quantity > 0
        ) {
        return next({
          status: 400,
          message: `Dish ${index} must have a quantity that is an integer greater than 0.`,
        });
      }
    });
    response.locals.order = request.body.data;
    next();
}

function validateDestroyCheck(req, res, next) {
    // check if status property of the order !== "pending"
    if(res.locals.order.status !== "pending") {
        return next({
            status: 400,
            message: "An order cannot be deleted unless it is pending",
        });
    }
    next();
};

function validateStatusCheck(req, res, next) {
    const { orderId } = req.params;
      const { data: { id, status } = {} } = req.body;
    // check if id of body does not match :orderId from the route
      if(id && id !== orderId) {
      return next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`
      })
    }
    // check if status property is missing ot empty and if not pending preparing or out for delivery
      else if(!status || status === "" || (status !== "pending" && status !== "preparing" && status !== "out-for-delivery")) {
      return next({
        status: 400,
        message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
      })
    }		
    // check if status property of the existing order === "delivered
      else if(status === "delivered"){
      return next({
        status: 400,
        message: "A delivered order cannot be changed"
      })
    }
    next();
};


/* Middleware */
function list(request, response) {
    response.json({ data: orders });
}

function create(request, response) {
    const { data: { deliverTo, mobileNumber, status, dishes} = {} } = request.body;
    const newOrder = {
        id: nextId(),
        deliverTo: deliverTo,
        mobileNumber: mobileNumber,
        status: status,
        dishes: dishes,
    };
    orders.push(newOrder);
    response.status(201).json({ data: newOrder });
};

function read(request, response) {
    response.json({ data: response.locals.order });
}

function update(request, response) {
    const { data: { deliverTo, mobileNumber, dishes, status } = {} } = request.body;
    response.locals.order = {
        id: response.locals.order.id,
        deliverTo: deliverTo,
        mobileNumber: mobileNumber,
        dishes: dishes,
        status: status,
    };
    response.json({ data: response.locals.order });
};
  

function destroy(request, response) {
    const index = orders.indexOf(response.locals.order);
    orders.splice(index, 1);
    response.sendStatus(204);
}

module.exports = {
    list,
    create: [validateOrderBody, create],
    read: [validateOrderExists, read],
    update: [validateOrderBody, validateOrderExists, validateStatusCheck, update],
    delete: [validateOrderExists, validateDestroyCheck, destroy],
};