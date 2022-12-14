const path = require("path");


const dishes = require(path.resolve("src/data/dishes-data"));


const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass


function validateDishExists(request, response, next) {
    const { dishId } = request.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
        response.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish id is not found: ${dishId}`,
    })
};
function validateDishBody(request, response, next) {
    const { data: { name, description, price, image_url } = {} } = request.body;
    if (!name || name === "") {
        next({
            status: 400,
            message: "A name property is required",
        });
    }
    if (!description || description === "") {
        next({
            status: 400,
            message: "A description property is required",
        });
    }
    if (!price) {
        next({
            status: 400,
            message: "A price property is required",
        });
    }
    if (price <= 0 || !Number.isInteger(price)) {
        next({
            status: 400,
            message: "price must be an integer above 0",
        });
    }
    if (!image_url || image_url === "") {
        next({
            status: 400,
            message: "An image_url property is required",
        });
    }
    next();
};

function validateDishId(request, response, next) {
    const { dishId } = request.params;
    const { data: { id } = {} } = request.body;
    if (!id || id === dishId ) {
        response.locals.dishId = dishId;
        return next();
    }
    next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}. Route: ${dishId}.`
    });
};


function list(request, response) {
    response.json({ data: dishes });
}

function create(request, response) {
    const { data: { name, description, price, image_url } = {} } = request.body;
    const newDish = {
        id: nextId(),
        name: name,
        description: description,
        price: price,
        image_url: image_url,
    };
    dishes.push(newDish);
    response.status(201).json({ data: newDish })
}

function read(request, response) {
    response.json({ data: response.locals.dish });
}

function update(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    res.locals.dish = {
      id: res.locals.dishId,
      name: name,
      description: description,
      price: price,
      image_url: image_url,
    };
    res.json({ data: res.locals.dish });
  };

module.exports = {
    list,
    create: [validateDishBody, create],
    read: [validateDishExists, read],
    update: [validateDishExists, validateDishBody, validateDishId, update],
};
