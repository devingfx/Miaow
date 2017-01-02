import { Window } from './Window.js'

export class Page extends Window {
	constructor( html )
	{
		// debugger;
		super( html || '<window page>' );
		this.$header = '<span>';
	}
	get title2()	{ return this.$header.find('span') }
	set title2( v ) { this.$header.find('span').append(v) }
}