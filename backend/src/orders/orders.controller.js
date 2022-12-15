const { response } = require("express");
const { redirect } = require("express/lib/response");
const res = require("express/lib/response");
const path = require("path");


const orders = require(path.resolve("src/data/orders-data"));

const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass


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
    if (!deliverTo || deliverTo === "") {
      return next({ status: 400, message: "Order must include a deliverTo" });
    }

    if (!mobileNumber || mobileNumber === "") {
      return next({ status: 400, message: "Order must include a mobileNumber" });
    }
   
    if (!dishes) {
      return next({ status: 400, message: "Order must include at least one dish" });
    }
   
    if (!Array.isArray(dishes) || dishes.length === 0) {
      return next({
        status: 400,
        message: "Order must include at least one dish",
      });
    }
  
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
      if(id && id !== orderId) {
      return next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`
      })
    }
      else if(!status || status === "" || (status !== "pending" && status !== "preparing" && status !== "out-for-delivery")) {
      return next({
        status: 400,
        message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
      })
    }		
      else if(status === "delivered"){
      return next({
        status: 400,
        message: "A delivered order cannot be changed"
      })
    }
    next();
};



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

function update(req, res) {
    const orderId = req.params.orderId;
    let { data: id, deliverTo, mobileNumber, status, dishes } = req.body;
    let updatedOrder = {
      id: orderId,
      deliverTo: req.body.data.deliverTo,
      mobileNumber: req.body.data.mobileNumber,
      status: req.body.data.status,
      dishes: req.body.data.dishes,
    };
  
    return res.json({ data: updatedOrder });
  }

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
