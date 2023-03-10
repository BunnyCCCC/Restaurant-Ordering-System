
/******************************************************/
/* This is client side js file for orderform.js       */
/******************************************************/
let currentSubtotal = 0;
let currentTotal = 0;
let currentFee = 0;
let currentRestaurant = null;

//The code used to submit the order
function submitOrder(){
	let info = {}
	info.restaurantID = select.selectedIndex;
	info.restaurantName = select.options[select.selectedIndex].value;
	info.subtotal = currentSubtotal;
	info.total = currentTotal;
	info.fee = currentFee;
	info.tax = currentSubtotal * 0.1;
	info.order = order;

	req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if(this.readyState==4 && this.status==200){
			alert("Order placed!")
			console.log(this.responseText);
			order = {}
			selectRestaurant();
		}
	}

	req.open("POST", `http://127.0.0.1:3000/orders`);
	req.setRequestHeader("Content-Type", "application/json");
	req.send(JSON.stringify(info));
}


//The drop-down menu
let select = document.getElementById("restaurant-select");
//Stores the currently selected restaurant index to allow it to be set back when switching restaurants is cancelled by user
let currentSelectIndex = select.selectedIndex
//Stores the current restaurant to easily retrieve data. The assumption is that this object is following the same format as the data included above. If you retrieve the restaurant data from the server and assign it to this variable, the client order form code should work automatically.
//Stored the order data. Will have a key with each item ID that is in the order, with the associated value being the number of that item in the order.
let order = {};
let restaurants = {};


//Called on page load. Initialize the drop-down list, add event handlers, and default to the first restaurant.
function init(){
	let res = JSON.parse(document.getElementById('restaurantMenus').getAttribute('data'));
	res.forEach((item) => {
		restaurants[item.name] = item;
	});
	document.getElementById("restaurant-select").innerHTML = genDropDownList();
	document.getElementById("restaurant-select").onchange = selectRestaurant;
	selectRestaurant();
}

//Generate new HTML for a drop-down list containing all restaurants.
function genDropDownList(){
	if (restaurants){
		//console.log(restaurants);
		let result = '<select name="restaurant-select" id="restaurant-select">';
		Object.keys(restaurants).forEach(elem => {
			console.log(typeof(elem));
			result += `<option value="${elem}">${elem}</option>`
		});
		result += "</select>";
		return result;
	}else{
		console.log("no restaurants");
	}
}

//Called when drop-down list item is changed.
function selectRestaurant(){
	let result = true;

	//If order is not empty, confirm the user wants to switch restaurants.
	if(!isEmpty(order)){
		result = confirm("Are you sure you want to clear your order and switch menus?");
	}

	//If switch is confirmed, load the new restaurant data
	if(result){
		//Get the selected index and set the current restaurant
		let selected = select.options[select.selectedIndex].value;
		currentSelectIndex = select.selectedIndex;
		currentRestaurant = restaurants[selected];
		currentMenu = currentRestaurant.menu;
		currentFee = currentRestaurant.delivery_fee;
		currentMin = currentRestaurant.min_order;
		currentSubtotal = 0;

		//Update the page contents to contain the new menu
		document.getElementById("left").innerHTML = getCategoryHTML(currentRestaurant);
		document.getElementById("middle").innerHTML = getMenuHTML(currentRestaurant);

		//Clear the current oder and update the order summary
		order = {};
		updateOrder();

		//Update the restaurant info on the page
		let info = document.getElementById("info");
		info.innerHTML = currentRestaurant.name + "<br>Minimum Order: $" + currentRestaurant.min_order + "<br>Delivery Fee: $" + currentRestaurant.delivery_fee + "<br><br>";
	}else{
		//If they refused the change of restaurant, reset the selected index to what it was before they changed it
		let select = document.getElementById("restaurant-select");
		select.selectedIndex = currentSelectIndex;
	}
}

//Given a restaurant object, produces HTML for the left column
function getCategoryHTML(rest){
	let menu = rest.menu;
	let result = "<b>Categories<b><br>";
	Object.keys(menu).forEach(key =>{
		result += `<a href="#${key}">${key}</a><br>`;
		console.log(key);
	});
	return result;
}

//Given a restaurant object, produces the menu HTML for the middle column
function getMenuHTML(rest){
	let menu = rest.menu;
	let result = "";
	//For each category in the menu
	Object.keys(menu).forEach(key =>{
		result += `<b>${key}</b><a name="${key}"></a><br>`;
		//For each menu item in the category
		Object.keys(menu[key]).forEach(id => {
			item = menu[key][id];
			result += `${item.name} (\$${item.price}) <img src='add.jpg' style='height:20px;vertical-align:bottom;' onclick='addItem(${id})'/> <br>`;
			result += item.description + "<br><br>";
		});
	});
	return result;
}

//Responsible for adding one of the item with given id to the order and updating the summary
function addItem(id){
	if(order.hasOwnProperty(id)){
		order[id].quantity += 1;
	}else{
		order[id] = {}
		order[id].quantity = 1;
		order[id].name = getItemById(id).name;
	}
	updateOrder();
}

//Responsible for removing one of the items with given id from the order and updating the summary
function removeItem(id){
	if(order.hasOwnProperty(id)){
		order[id].quantity -= 1;
		if(order[id].quantity <= 0){
			delete order[id];
		}
		updateOrder();
	}
}

//Reproduces new HTML containing the order summary and updates the page
//This is called whenever an item is added/removed in the order
function updateOrder(){
	let result = "";
	currentSubtotal = 0;

	//For each item ID currently in the order
	Object.keys(order).forEach(id =>{
		//Retrieve the item from the menu data using helper function
		//Then update the subtotal and result HTML
		let item = getItemById(id);
		currentSubtotal += (item.price * order[id].quantity);
		result += `${item.name} x ${order[id].quantity} (${(item.price * order[id].quantity).toFixed(2)}) <img src='remove.jpg' style='height:15px;vertical-align:bottom;' onclick='removeItem(${id})'/><br>`;
	});

	//Add the summary fields to the result HTML, rounding to two decimal places
	result += `Subtotal: \$${currentSubtotal.toFixed(2)}<br>`;
	result += `Tax: \$${(currentSubtotal*0.1).toFixed(2)}<br>`;
	result += `Delivery Fee: \$${currentRestaurant.delivery_fee.toFixed(2)}<br>`;
	currentTotal = currentSubtotal + (currentSubtotal*0.1) + currentRestaurant.delivery_fee;
	result += `Total: \$${currentTotal.toFixed(2)}<br>`;

	//Decide whether to show the Submit Order button or the Order X more label
	if(currentSubtotal >= currentRestaurant.min_order){
		result += `<button type="button" id="submit" onclick="submitOrder()">Submit Order</button>`
	}else{
		result += `Add \$${(currentRestaurant.min_order - currentSubtotal).toFixed(2)} more to your order.`;
	}

	document.getElementById("right").innerHTML = result;
}

//Helper function. Given an ID of an item in the current restaurant's menu, returns that item object if it exists.
function getItemById(id){
	let categories = Object.keys(currentRestaurant.menu);
	for(let i = 0; i < categories.length; i++){
		if(currentRestaurant.menu[categories[i]].hasOwnProperty(id)){
			return currentRestaurant.menu[categories[i]][id];
		}
	}
	return null;
}

//Helper function. Returns true if object is empty, false otherwise.
function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}
