import { Element } from './Element.js';

export class MultiEditor extends Element {
	constructor( data )
	{
		// debugger;
		super( `<MultiEditor>`);
		this.customStyles = {}
		this.rawChildren = this[0].createShadowRoot();
		this.rawChildren.innerHTML = `<style>
			:host { white-space: pre; display: block; margin: 0; }
			 *:focus {
				outline: none;
			}
		</style>`;
		
		this.addStyle('json', `
			StringLiteral, 
			BooleanLiteral, 
			NumberLiteral, 
			ArrayExpression, 
			key, 
			NullLiteral { display: inline; }
				NullLiteral::before { content: 'null'; }
				NullLiteral:not(:empty) {  }
					NullLiteral:not(:empty)::after { content: '"'; }
					NullLiteral:not(:empty)::before { content: '"'; color: green; }
			StringLiteral {  }
				StringLiteral::before { content: '"'; }
				StringLiteral::after { content: '"'; }
			BooleanLiteral {  }
			NumberLiteral {  }
			ArrayExpression {  }
				ArrayExpression::before { content: "["; }
				ArrayExpression::after { content: "]"; }
			ObjectExpression {  }
				ObjectExpression::before { content: "{"; }
				ObjectExpression::after { content: "}"; }
			ObjectProperty:not(:last-child)::after { content: ","; }
				ObjectProperty > value::before { content: ' '; }
				ObjectProperty > key::after { content: ' :'; }
		`);
		
		this.addStyle('json-pretty', `
			elements, properties {
				margin-left: 4em;
				display: block;
			}
			ObjectProperty { display: block; margin-left: 4em; }
		`);
		
		this.addStyle('json-color', `
		    NullLiteral { color: grey; }
				NullLiteral:not(:empty) { color: green; }
					NullLiteral:not(:empty)::before { color: green; }
			BooleanLiteral { color: darkorchid; }
			NumberLiteral { color: blue; }
			StringLiteral { color: green; }
				ObjectProperty::after { content: none; }
					ObjectProperty > key > StringLiteral { 
						border-bottom: 1px dashed;
						color: currentColor;
					}
						ObjectProperty > key > StringLiteral::before,
						ObjectProperty > key > StringLiteral::after { content: none; }
		`);
		
		this.addStyle('json-form', `
		`);
		
		
		this.data = data;
		this.root = $( this.transform(data) ).appendTo( this.rawChildren );
		// this.$el[0].innerHTML = `<header>${before}</header>` + this.stringify(data);
		document.body.setAttribute('spellcheck',"false");
		
		this.on('keydown','[contenteditable]', e=> {
			e.key == 'Enter' && (e.preventDefault(),e.target.blur());
		});
		// Array.from( this.find('[contenteditable]').get() )
		//	 .map( node=> 
		//	 	node.addEventListener('keydown', e=> {
		//	 		debugger;
		//	 		e.key == 'Enter' && (e.preventDefault(),e.target.blur());
		//	 	}) 
		//	 )
		
	}
	on( type, sel, fn )
	{
		this.addEventListener( type, function(e)
		{
			if( e.target.matches(sel.split(',').map(s=>s+' *').join(',')) )
				fn.call(e.target, e);
		})
	}
	transform( json )
	{
		switch( typeof json )
		{
			case 'undefined': return `<NullLiteral contenteditable="true"></NullLiteral>`;
			case 'boolean': return `<BooleanLiteral value="${json}" contenteditable="true">${json}</BooleanLiteral>`;
			case 'number': return `<NumberLiteral value="${json}" contenteditable="true">${json}</NumberLiteral>`;
			case 'string': return JSON.stringify( json ).replace(/^(")(.*)(")$/, 
								'<StringLiteral contenteditable="true" value="$2">$2</StringLiteral>');
			case 'object': if( Array.isArray(json) )
								return `<ArrayExpression><elements>${json.map( item=> this.transform(item) ).join(',\n')}</elements></ArrayExpression>`;
							else if( json === null )
								return `<NullLiteral contenteditable="true"></NullLiteral>`;
							else
								return `<ObjectExpression type="${json['@type']||json.constructor.name}">${
											Object.getOwnPropertyNames(json)
												.map( n=> 
													`<ObjectProperty key="${n}" value="${json[n]}"><key>${this.transform(n).replace(' ',' key ')}</key><value>${this.transform(json[n])}</value></ObjectProperty>`
												).join('')}</properties></ObjectExpression>`;
		}
	}
	toComputedString()
	{
		// let copy = this.clone();
		let copy = $(this.rawChildren).find('> :not(style)').clone();
		// copy.find('style').remove();
		this.toggleStyle('*',false);
		this.toggleStyle('json',true);
		// str=this.toComputedString();
		// JSON.parse(str)

		this.rawChildren.appendChild( copy[0] );
		copy.find('*').addBack()
			.map( (i,n)=> {
			  	var b = eval(getComputedStyle(n,':before').content);
			   	var a = eval(getComputedStyle(n,':after').content);
				$(n).prepend( b )
					.append( a )
			})
		let str = copy.text();
		copy.remove();
		
		this.toggleStyle('*',true);
		return str;
	}
	addStyle( name, css )
	{
		var s = document.createElement('style');
		s.id = name;
		s.innerText = css;
		this.rawChildren.append(s);
		// s.disabled = true;
		this.customStyles[name] = s;
	}
	toggleStyle( name, force )
	{
		if( name == '*' )
			Object.getOwnPropertyNames( this.customStyles )
				.map( name=> this.customStyles[name].disabled = typeof force != 'undefined' 
																	? !force
																	: !this.customStyles[name].disabled
				)
		else if( this.customStyles[name] )
			this.customStyles[name].disabled = typeof force != 'undefined' ? !force : !this.customStyles[name].disabled;
	}
	static addStyle(){}
	static addPlugin(){}
}