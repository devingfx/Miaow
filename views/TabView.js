import { Element } from './Element.js';

export class TabView extends Element {
	constructor( html )
	{
		// debugger;
		super( html || '<tab><tabs>' );
		this.tabs = this.find('tabs');
		this.update();
	}
	appendChild( child )
	{
		this.append( child );
		this.update();
	}
	update()
	{
		this.tabs.empty();
		this.children().map( (i,node)=> node != this.tabs[0]
									 && $(`<button><lang>${$(node).attr('label')||'Tab'}</lang></button>`)
									 		.on('click', e=> {
									 			this.children(':not(tabs)').hide();
									 			$(node).show();
									 			this._selectedIndex = $(node).index();
									 			this.tabs.children().removeClass('selected');
									 			this.tabs.children().eq(this._selectedIndex-1).addClass('selected');
								 			})
								 			.appendTo(this.tabs)
						 );
		// debugger;
		this.tabs.children().eq(this._selectedIndex-1).addClass('selected');
	}
	get selectedIndex()	 { return this._selectedIndex }
	set selectedIndex( v )  { this.header.find('h1').append(v) }
	get currentTab()	 	{ return this.header.find('h1').text() }
	set currentTab( v )  	{ this.header.find('h1').append(v) }
}