import { Page } from './Page.js'
import { DataTable } from './DataTable.js'

export class TablePage extends Page {
	constructor( html )
	{
		// debugger;
		super( html || '<window page>' );
		this.content.css({ padding: 0 });
		
		this.content = ( this.table = new DataTable );
		
		
		// this.table.appendTo( this.$content ); // appends
		this.title2 = this.content.find('.dataTables_info')
		this.header = this.content.find('.dataTables_filter')
									.css({
										position: 'absolute',
										right: 10,
										top: 10
									})
		this.header = this.content.find('.dataTables_scrollHead')
									.css({ margin: '14px -15px' })
		this.footer = this.content.find('.dataTables_scrollFoot')
		this.footer.css({ padding: 3 });
		this.table.draw();
		// this.content = this.tabview; // replace reference
	}
	
	get content() { return this.table }
	set content( v )
	{
		// this.tabview.appendChild( v );
	}
}