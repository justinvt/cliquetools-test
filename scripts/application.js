//================================================
// Class Extensions
//================================================

// Extending the base javascript Object class to allow for "sums"
// to be calculated on objects (we'll use this to find order totals later)




$(document).ready( function() {

	// Add a blank message at top of page
	init_message()
	// Initialize given table as an "Order" object
	var orders = $("table:eq(0)").OrderTable()

	// Undo on #undo click
	$(".message #undo").click( function() { orders.undo() } )
	
	
	// Replace submit and reset buttons with given html
	$("ul.actions input[type='submit']").hide().after("<a href='#' class='complete'>Complete Order</a>")
	$("ul.actions input[type='reset']").hide().after("<a href='#' class='reset'>Start Over</a>")
	
	// Force submit/reset replacements to duplicate functionality of the original
	// buttons by triggering a click of their hidden counterparts before running
	// additional functions
	$(".complete").click(function(){ 
		alert(JSON.stringify(orders.contents()))
		$("ul.actions input[type='submit']").click() 
	})
	$(".reset").click(function(){ 
		$("ul.actions input[type='reset']").click() 
		orders.reset() 
	})
	

	
	// Just some styling stuff
	$(".subtotal_label").wrapInner("<em/>")
	$("tfoot .total").wrapInner("<strong/>")
	
	
})