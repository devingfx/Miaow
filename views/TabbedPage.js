import { Page } from './Page.js'
import { TabView } from './TabView.js'

export class TabbedPage extends Page {
	constructor( html )
	{
		// debugger;
		super( html || '<window page>' );
		this.tabview = new TabView;
		this.tabview.appendTo( this.content ); // appends
		this.content = this.tabview; // replace reference
	}
}