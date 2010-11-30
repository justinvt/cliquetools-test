//================================================
//              Classes
//================================================

// Order - a Class representing a single row (or order) in the table

function Order(jquery_element){
	
	this.row              =  jquery_element
	this.name_field       =  this.row.find("td input[type='text']")
	this.price            =  this.row.find(".total")
	this.name             =  this.name_field.val()
	this.selected_options =  this.row.find("select option:selected")
	this.hidden           = this.row.find("input[type='hidden']:first")
	
	this.selections       =  $.map(this.selected_options, function(i){ return {
			option:$.trim($(i).text()), 
			name:  $(i).parents("select:eq(0)").attr("name"),
			price: $(i).price(),
			group: $(i).optionGroup(),
			type:  $(i).get(0).tagName
		} 
	})
	
	this.non_blank_selections = $.grep(this.selections, function(j){ return j.option.length > 0 })

	this.orders_table     =  this.row.parents("table:eq(0)")
	this.required_fields  = "select, td input[type='text']"
	

	this.invalid_fields    = function(){
		
		return $.grep( $(this.row.find(this.required_fields) ).toArray(), function(n,i) {
			return $(n).attr("value").replace(/[^a-z\.0-9]+/,'').length == 0
		})
		
	}
	
	this.valid = function(){ return this.invalid_fields().length == 0 }
	
	this.total = function(){ return this.non_blank_selections.sum(function(i){ return i.price }) }
	
	this.displayErrors = function () {
		
		$.each( $(this.row.find(this.required_fields)).toArray(), function(n,i) {
			$(i).parents("td:eq(0)").removeClass("error")
		})
		
		$.each( this.invalid_fields(), function(n,i) {
			$(i).parents("td:eq(0)").addClass("error")
		})
		
		return this
	}
	
	this.updateTotal = function () {
		
		this.displayErrors()
		this.price.price(this.total())

		return this
	}
	
	this.addUndoToken = function(){
		var key = "undo_" + this.row.attr("id").replace(/^[a-zA-Z\-\_]+/,"")
		var undo_token = $("<div></div>").attr("id", key)
		undo_token.data( "undo", this.contents )
		this.orders_table.find(".data_bin").append( undo_token )
		return this
	}
	
	this.remove = function () {
		this.addUndoToken()
		this.row.hide()
		this.hidden.val(true)
		post_message(messages.orders.removed, true, "success")
		
		return this

	}
	
	this.undoData = function(){
		var key = "undo_" + this.row.attr("id").replace(/^[a-zA-Z\-\_]+/,"")
		return $(key).data("undo")
	}
	
	this.restore = function (){
		this.row.show().find(".hidden").val(false)
	}
	
	// Object representing all selections and important attributes of the order
	
	this.contents = {
		name: this.name,
		selections: this.non_blank_selections,
		total: this.total(),
		valid: this.valid()
	}
	

	return this
	
}


// OrderTable - a Class representing the entire table, a collection of Order(s)

function OrderTable(selector){
	
	// Set some variables
	
	var link_button   = $("<a></a>").attr("href","#")
	var remove_button = link_button.clone().addClass("remove").text("Remove")
	var add_button    = link_button.clone().addClass("add").text("Add an Order")

	// The objects below (additional_columns & total_row_elements)
	// represent the data we'll be adding to the default table
	// to hold order totals and the "add/remove" controls
	
	// Columns and default values to add to given table

	var additional_columns = [
		{ heading: "Total", content: "$0.00", cssClass: "total", heading_style: "width: 100%"},
		{ heading: "", content: remove_button, cssClass: "actions" }
	]
	
	// The Subtotal row - contains subtotal and the "add order" control

	var total_row_elements = [
		{ cssClass: "subtotal_label", content: "Sub-total" },
		{ cssClass: "total",       content: "$0.00" },
		{ cssClass: "actions",        content: add_button }
	]
	
	// A find method that works like the default jquery find
	
	this.find      = function(selector_array) { 
		
		selector_array = selector_array.constructor == String ? [selector_array] : selector_array
		
		return $( [selector, selector_array.join(" ") ].join(" ") )
		
	}
	
	// instance attributes - just some selectors and the undo_history array

	this.selector         = selector
	this.table            = $(selector)
	this.form             = this.table.find("form")
	this.header           = this.find("thead") // $([selector, thead])
	this.body             = this.find("tbody")
	this.options          = this.find("select")
	
	this.prototype_order  = this.columns = this.foot = null
	this.undo_history     = []
	
	// Instance methods
	// instance methods for tabulating total
	// Note we're only considering visible orders here...

	this.orders      = function() { return this.body.find("tr:visible") }
	
	// This function returns the rows as Order objects instead of jquery objects
	
	this.all_orders  = function() { return $.map(this.orders(), function(i) { return  $(i).asOrder() } )}
	
//	this.total       = function() { return  $.map(this.orders(),function(i){ return $(i).asOrder().total() }).sum() }
	this.total       = function() { return  this.all_orders().sum( function(i){ return i.total() } ) } 
	
	// Are all of the orders valid?  We don't really use this for anything - I just figured it would be useful eventually
	// it checks the .contents method on each order and returns true if the number of rows that are invalid is equal to 0
	
	this.valid       = function() { return  ($.grep(this.all_orders(), function(i){ return ( i.contents.valid == false ) }).length == 0) }
	
	// Method to update form input names (main-# becomes main-0 etc) - not really necessary as we could parse this later in a controller
	
	this.updateInputs = function () {
		$.each(this.orders(), function(i,j){
			$(j).find("input, select").each(function(){ $(this).attr("name", $(this).attr("name").replace(/[0-9\#]+$/,i) ) })
		})
		return this
	}
	
	// Run updateInputs() and update subtotal value
	
	this.updateTotal = function() {
		this.updateInputs()
		this.foot.find(".total").price(this.total()) 
		return this
	}
	
	// Method to Update all rows individually, then subtotal value
	// (composite of individual row total update, updateTotal)
	// Run this each time something major changes 
	
	this.updateOrders = function () {
		$.each(this.all_orders(), function(i,j){ j.updateTotal() })
		return this.updateTotal()
	}

	
	// Instance methods for pushing to and popping from undo history
	// undo is handled by hiding rows and recording the order in which they were hidden
	// hidden orders/rows will not be considered in the total, etc, via the orders() method

	this.saveUndo    = function(element) { 
		var id = $(element).parents("tr:eq(0)").attr("id")
		this.undo_history.push(id)
	
		if(this.undo_history.length > 0)
			$("#undo").show()
		return 	this
	}
	
	this.undo        = function() {
		if(this.undo_history.length > 0) {
			var last_row = this.undo_history.pop()
			var last =  "#" + last_row
			$(last).asOrder().restore()
			if(this.undo_history.length == 0)
				$("#undo").hide()
			this.updateOrders()
		}
		return this
	}
	
	// These 2 methods (addDefaultColumns & addTotalRow) are kind of overkill
	// this is a generic method to add columns specified by "additional_columns"
	// After this method is finished, we can record our prototypical order
	// (aka the first order that was contained in the original html), which will
	// be used as the template for future added orders
	
	this.addDefaultColumns = function() {
		
		var header = this.header
		var orders = this.orders()
		
		$.each(additional_columns, function(i,j) {
			
			var cell = $("<td></td>")
			
			header.find("tr").append("<th>" + j.heading + "</th>")
			if (j.heading_style) { header.find("th:last").attr("style", j.heading_style) }
			cell.addClass(j.cssClass)
			j.content.constructor === String ? cell.text(j.content) : cell.append(j.content)
			
			return orders.append(cell)
			
		})
		
		// this line gets rid of some default css weirdness - not necessary
		this.find("select").css({margin: "0px","border-style":"solid", padding: "0px"})
		this.first_order = this.find("tbody tr:eq(0)")
		this.first_order.find("input[type='text']").after("<input type='hidden' name='hidden-#' value=false class='hidden'/>")
		this.columns = this.first_order.find("td").size()
		
		return this
		
	}

	// This is a generic method to add the "subtotal" row and "add order" control
	// as specified by the total_row_elements variable
	
	this.addTotalRow = function() {
		
		var foot = this.foot = $("<tfoot><tr></tr></tfoot>")
		var colspan = (this.columns - total_row_elements.length) + 1
		
		$.each(total_row_elements, function(i,j){
			
			var cell = $("<td></td>").addClass(j.cssClass)
			
			$.type(j.content) === "string" ? cell.text(j.content) : cell.append(j.content)
			if(i == 0)
				cell.attr("colspan", colspan)
			foot.find("tr").append(cell)
			
		})
		
		this.table.append(foot)
		
		return this
		
	}
	
	// Record the row we started out with as default order
	// remove that behaviorless html, and add it again, this time ascribing
	// default behaviors.  This could have been done with jquery's deep cloning
	// but this is more explicit, since we start with "dead" html
	
	this.replaceDefaultOrder = function() {
		
		this.prototype_order = "<tr>" + this.first_order.html() + "</tr>"
		this.orders().first().remove()
		
		this.addOrder()
		
		return this
	}
	
	this.addDataBin = function() {
		var dataBin = $("<tr><td colspan='5'></td></tr>")
		dataBin.css({display:"none"}).find("td").addClass("data_bin")
		this.foot.append(dataBin)
		return this
	}
	
	// The method that is run after a user clicks on the "Add Order" button
	// This essentially takes the html from the first row that was given to us on page load
	// and reproduces it indefinitely.  There are also event handlers
	// for clicks on the "remove order" button and changes made to the select
	// fields, both of which update the complete order's total
	
	this.addOrder = function() {
		
		var order_table = this
		this.body.append( $( this.prototype_order ) )
		
		this.body.find("tr:last").attr("id", unique_id("order"))
		
		// Assign behavior for "remove"  control
		
		this.find("tbody .actions .remove:last").click( function() { 
			
			var orders_would_remain = 1 < order_table.orders().length
			
			if(orders_would_remain){
				if(confirm(messages.orders.removal_confirmation_message)){
					order_table.saveUndo(this)
					$(this).parentOrder().remove()
					order_table.updateOrders()
				}
			}
			else{
				alert(messages.orders.ban_sole_order_destroy_message)
			}
			
			return true
			
		})
		
		// Assign behavior for field change
		
		this.find("tbody select, tbody input[type='text']").change( function() { order_table.updateOrders() })
		
		return this.updateOrders()
	}
	
	this.restore = function(){
		var f = $(".data_bin div:last")
		if(f.length == 1){
			var data = f.data("undo")
			this.addOrder()
			var last = this.body.find("tr:last")
			last.find("input[type='text']").val(data.name)
			$.each(data.selections, function(i,j){
				var name = j.name.replace(/[\-0-9]+$/,'')
				var option = j.option
				var last_id = last.attr("id")
				var select_field = last.find("select[name^='" + name + "']")
				var selected_option = select_field.find("option:contains('" + option + "')")
				if(j.type == "OPTION"){
					select_field.find("option").attr("selected",false)
					selected_option.attr("selected","selected")
				}
			})
			f.remove()
			this.updateOrders()
		}
		return this
	}
	// Order selections and important attributes as a clean JS object
	
	this.contents = function(){
		var selected_items =  $.map(this.all_orders(), function(i){  return i.contents 	} )
		return {orders: selected_items, sub_total: this.total() }
	}
	
	// Action to execute when form reset button is clicked
	// This could delete all rows or do something else but I left it empty
	// because I wasn't sure how default reset behavior should operate
	
	this.reset = function(){ 	return this.updateOrders() }
	
	// Ties all of the html building stuff above into one method
	// In order it: Tells the "Add" button how to behave, adds
	// the "total" column to each order and a column to hold the "remove"
	// button, Adds a row to hold the Subtotal and "Add" control at table footer,
	// removes the blank order that was given to us, as it hasn't had any behaviors
	// attached, adds a blank order through the "addOrder" method, which DOES ascribe
	// all of the desired behaviors.
	
	this.init = function() {
		var order_table = this
		add_button.click( function() { order_table.addOrder() } )
		
		return this.addDefaultColumns().addTotalRow().addDataBin().replaceDefaultOrder()
	}
	
	return this.init()
}