import { Element } from './Element.js'

export class Window extends Element {
	constructor( html )
	{
		// debugger;
		super( html || '<window>' );
		// this.$el = $('<section>');
		// this.$el[0].ctrl = this;
		// this.$el[0].innerHTML = `
		this.html(`
			<header>
				<icon></icon>
				<h1></h1>
				<controls>
					<button><icon min>_</icon></button>
					<button><icon max>+</icon></button>
					<button><icon restore>o</icon></button>
					<button><icon close>x</icon></button>
				</controls>
			</header>
			<div class="content"></div>
			<footer></footer>
		`);
		this.header = this.find('header');
		this.content = this.find('.content');
		this.footer = this.find('footer');
	}
	get icon()	 { return this.header.find('> icon') }
	set icon( v )  { this.header.find('h1').append(v) }
	get title()	 { return this.header.find('h1').text() }
	set title( v )  { this.header.find('h1').append(v) }
	get head()	  { return this.header }
	set head( v )   { this.header.append(v) }
	get content()   { return this.content }
	set content( v ){ this.content.append(v) }
	get footer()	{ return this.footer }
	set footer( v ) { this.footer.append(v) }
}
