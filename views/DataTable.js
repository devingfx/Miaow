import $ from 'jquery';
import 'https://cdn.datatables.net/1.10.12/css/jquery.dataTables.css';
import 'https://cdn.datatables.net/1.10.12/js/jquery.dataTables.js';

// import { Element } from './Element.js';

export class DataTable extends HTMLTableElement {
	constructor( html )
	{
		super();
		var colNum = 10;
		// debugger;
		this.rawChildren = this.attashShadow({ mode: 'open' });
		this.rawChildren.innerHTML = `
		<table class="display" cellspacing="0" width="100%">
			<tfoot>
				<tr>
				 ${'<td>'.repeat(colNum)}
				</tr>
			</tfoot>
		</table>`;
		
		this.update();
	}
	// appendChild( child )
	// {
	// 	this.append( child );
	// 	this.update();
	// }
	update()
	{
		if( this._data && this._columns )
		{
			var table = $(this).DataTable({
				scrollY: '100%',
				scrollX: true,
				paging:   false,
				select:   true,
				data: this._data,
				dom: 'iftr',
				"processing": true,
				columns: this._columns,
				initComplete: this._createFooters
			});
			
			table.draw();
		}
	}
	
	get data() { return this._data }
	set data( v )
	{
		this._data = v;
		this.update();
	}
	
	get columns() { return this._columns }
	set columns( v )
	{
		this._columns = v;
		this.update();
	}
	
	get selectedIndex()	 { return this._selectedIndex }
	set selectedIndex( v )  { this.header.find('h1').append(v) }
	
	_createFooters( settings )
	{
		this.api().columns( '.select-filter' ).every( function () {
			var column = this;
			var select = $('<select><option value=""></option></select>')
				.appendTo( $(column.footer()).empty() )
				.on( 'change', function () {
					var val = $.fn.dataTable.util.escapeRegex(
						$(this).val()
					);

					column
						.search( val ? '^'+val+'$' : '', true, false )
						.draw();
				} );

			column.data().unique().sort().each( function ( d, j ) {
				select.append( '<option value="'+d+'">'+d+'</option>' )
			} );
		} );
		this.api().columns( '.text-filter' ).every( function () {
			var column = this;
			var select = $('<input type="text" placeholder="Search '+column.title+'" />')
				.appendTo( $(column.footer()).empty() )
				.on( 'keyup change', function () {
					// var val = $.fn.dataTable.util.escapeRegex(
					//	 $(this).val()
					// );
					if ( column.search() !== this.value ) {
						column
							.search( this.value )
							.draw();
						// column
						//	 .search( val ? '^'+val+'$' : '', true, false )
						//	 .draw();
					}
				} );
		} );
		
		$('tbody', settings.nScrollBody)
			.on( 'click', 'tr', function () {
				$(this).toggleClass('selected');
			})
			.on( 'dblclick', 'tr', function () {
				store.showObjectPage( table.row(this).data() )
			});
	}
}

customElements.define( 'data-table', DataTable, {extends: 'table'} );