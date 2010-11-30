

Object.prototype.sum = function(lambda) {
	
	var total = 0.0
	
	for(var i = 0;i < this.length; i++) { 
		
		var add_on = ($.type(lambda) === "function") ? lambda.call(this,this[i]) : this[i]
		
		if($.type(add_on) === "string")
			add_on = add_on.replace(/[^0-9\.]/,"")
			
		total = total + Number(add_on)
		
	}
	
	return total
	
}

String.prototype.price = function (){
	var parsed_value = Number($.trim(this.replace(/[^0-9\.]+/,""))).toFixed(2) 
	return parsed_value
}

//================================================
//              Extending Jquery
//================================================

// Properly format the text of an element as a currency value

jQuery.fn.extend({
	price: function(value){
		if(value == null || $.type(value) === "undefined"){
			var parsed_value = this.attr("value") == "None" ? 0 : $.trim(this.attr("value"))
			return  parsed_value
		}
		else{
			this.text("$" + value.toString().price()); 
			return value
		}
	},
	OrderTable: function(){ var order_table = new OrderTable(this.selector); return order_table },
	asOrder: function(){ var order = new Order(this); return order },
	Order: function(){ return this.parents("tr:first").asOrder() },
	parentOrder: function(){ return this.Order() },
	optionGroup: function(){ return this.parents("optgroup:eq(0)").size() == 1 ? this.parents("optgroup:eq(0)").attr("label") : ""}
})


//================================================
//              Helper Methods
//================================================

function random_id_selector(prefix){
	return prefix + "_" + parseInt(Math.random() * $(document).find("*").size())
}

function unique_id(prefix){

	do {
		var rand = random_id_selector(prefix)
	} while ( $( "#" + rand ).length > 0 || rand == null)
	
	return	rand
}

function post_message(message, undoable, status){
	
	message = message || ""

	if($(".message").length < 1)
		$("body").prepend("<div class='message success'><h3></h3></div>")

	if($(".message #undo").length < 1)
		$(".message").append("<a href='#' id='undo'>Undo</a>")
		
	message.length == 0 ? $(".message").hide() : $(".message").show()

	$(".message h3").text(message)
	
	
	return message

}

// We need a hidden message in place to assign behaviors so this function does that
// for us

function init_message(){
	post_message("")
	return true
}
