var org;
function loadSchemaOrg()
{
	$.getJSON('http://schema.org/version/latest/all-layers.jsonld')
		.then( json=> {
			org.schema = json;
			org.schema = {version:{latest:{"all-layers":json}}};
			org.schema.search = function( str )
			{
				return this['@graph'].map( lib=> 
					lib['@graph']
						// .filter( o=> o['@type']=='rdf:Property' && o['http://schema.org/domainIncludes'] && o['http://schema.org/domainIncludes']['@id']=='http://schema.org/Person')
						.filter( o=> new RegExp(str,'i').test(o['rdfs:label']) )
						// .map(o=>o['rdfs:label'])
				)
				.reduce( (p,n)=> p.concat(n) )
			}
			
		})
}
/*
org.schema.search('fuel')
	.map( o=> {
		let domain = o['http://schema.org/domainIncludes']
						? Array.isArray(o['http://schema.org/domainIncludes'])
							? o['http://schema.org/domainIncludes'][0]['@id']
							: o['http://schema.org/domainIncludes']['@id']
						: '';
		console.log(
		`%c${ o['@type'] == 'rdf:Property' && domain
				? `${domain.split('/').pop()}.` 
				: ''}%c${o['rdfs:label']}`,
		'color:blue', ''
	)})
*/

window.SchemaExtractor = class SchemaExtractor {
	constructor( json, doc )
	{
		this[SchemaExtractor.schema] = json;
		if( doc )
			return this.from( doc );
	}
	from()
	{
		arguments[0] = arguments[0] || document;
		return Promise.all(
					Array.from( arguments )
						.map( thing=> this.extract(this[SchemaExtractor.schema], [thing]) )
				)
				.then( res=> res.length == 1 ? res[0] : res );
	}
	resolvePropertySync( val, node )
	{
		var handlers = [];
		if( val.indexOf('=>') !== -1 )
		{
			var a = val.split('=>');
			val = a.shift();
			handlers = a.map( js=> new Function('item,index,list',`return `+js).bind(node) );
		}
		if( val.indexOf('@selector:') === 0 )
		{
			var a = val.split(':');
			a.shift();
			val = a.join(':');
			val = this.selector( val, node );
		}
		if( val.indexOf('@xpath:') === 0 )
		{
			var a = val.split(':');
			a.shift();
			val = a.join(':');
			val = this.xpath( val, node );
		}
		if( val.indexOf('@json:') === 0 )
		{
			var a = val.split(':');
			a.shift();
			val = a.join(':');
			val = this.jsonPath( val, node );
		}
		val = Array.isArray(val) ? val : [val];
		handlers.length &&
			handlers.map(f=>(val = val.map(f)));
		
		return val.length == 0
				? null
				: val.length == 1
					? val[0]
					: val;
	}
	extractSync( json, nodes )
	{
		if( json['@selector'] )
		{
			nodes = this.selector( json['@selector'], nodes[0] );
		}
		if( json['@xpath'] )
		{
			nodes = this.xpath( json['@xpath'], nodes[0] );
		}
		console.log( json, nodes );
		var res = nodes.map( node=> {
			
			var result = {};
			Object.getOwnPropertyNames( json )
				.filter( key=> !/(@selector|@xpath]/.test(key) )
				// .filter( key=> key !== '@selector' && key !== '@xpath' )
				.map( key=> {
					// if( key !== '@selector' && key !== '@xpath' )
						switch( typeof json[key] )
						{
							case 'object': result[key] = Array.isArray(json[key])
															? json[key].map( item=> this.extract( item, [node] ))
															: this.extract( json[key], [node] );
							break;
							case 'string': result[key] = this.resolveProperty( json[key], node ); break;
							case 'function': result[key] = json[key]( node ); break;
							default: result[key] = json[key]; break;
						}
				})
			return result;
		})
		return res.length == 1 ? res[0] : res;
	}
	selectorSync( sel, context )
	{
		var res = context.querySelectorAll( sel );
		var arr = Array.from( res );
		arr = arr.map( n=> n.nodeValue ? n.nodeValue : n );
		return arr;
	}
	xpathSync( path, context )
	{
		
		var res = context.ownerDocument.evaluate( path, context, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
		var arr = Array(res.snapshotLength).fill(0)
					.map( (o,i)=> res.snapshotItem(i) );
		arr = arr.map( n=> n.nodeValue ? n.nodeValue : n );
		return arr;
		// return arr.length === 1
		// 		? arr[0]
		// 		: arr
	}
	async resolveProperty( val, node )
	{
		var handlers = [], modRes;
		
		if( val.indexOf('=>') !== -1 )
		{
			var a = val.split('=>');
			val = a.shift();
			handlers = a.map( js=> new Function('item,index,list',`return `+js).bind(node) );
		}
		if( modRes = /^@(selector|xpath|json)\s*:(.*)/.exec(val) )
		{
			val = this[modRes[1]]( modRes[2], node );
		}
		else
		{
			val = Promise.resolve( [val] );
		}
		// if( val.indexOf('@selector:') === 0 )
		// {
		// 	var a = val.split(':');
		// 	a.shift();
		// 	val = a.join(':');
		// 	val = this.selector( val, node );
		// }
		// if( val.indexOf('@xpath:') === 0 )
		// {
		// 	var a = val.split(':');
		// 	a.shift();
		// 	val = a.join(':');
		// 	val = this.xpath( val, node );
		// }
		// if( val.indexOf('@json:') === 0 )
		// {
		// 	var a = val.split(':');
		// 	a.shift();
		// 	val = a.join(':');
		// 	val = this.jsonPath( val, node );
		// }
		return val.then( val=> {
			
			// val = Array.isArray(val) ? val : [val];
			handlers.length &&
				handlers.map(f=>(val = val.map(f)));
		
			return val.length == 0
					? null
					: val.length == 1
						? val[0]
						: val;
		})
	}
	async extract( json, nodes, _loaded )
	{
		console.groupCollapsed( 'extract( %o, %o )', json, nodes );
		
		switch( typeof json )
		{
			case 'object': if( !Array.isArray(json) )
			{
				
				if( !_loaded && json['@selector'] )
				{
					return Promise.all(
							nodes.map( nn=> this.selector( json['@selector'], nn ) )
						)
						.then( arr=> 
							Promise.all(
								arr.map( nodes=> 
									this.extract( json, nodes, true )
								)
							)
						)
					// return this.extract( json, await this.selector( json['@selector'], nodes[0] ) )
					// nodes = await this.selector( json['@selector'], nodes[0] );
					// console.log('selected by css: ', nodes );
				}
				if( !_loaded && json['@xpath'] )
				{
					return Promise.all(
							nodes.map( nn=> this.xpath( json['@xpath'], nn ) )
						)
						.then( arr=> 
							Promise.all(
								arr.map( nodes=> 
									this.extract( json, nodes, true )
								)
							)
						)
					// nodes = await this.xpath( json['@xpath'], nodes[0] );
					// console.log('selected by xpath: ', nodes );
				}
				var proms = Promise.all( nodes.map( node=>
					{
						var result = {};
						
						Object.getOwnPropertyNames( json )
							.filter( key=> !/(@selector|@xpath)/.test(key) )
							.map( async key=> {
								result[key] = this.extract( json[key], [node] )
							})
						
						return Promise.all( Object.values(result) )
								.then( arr=> Object.getOwnPropertyNames(result)
												.filter( key=> result[key] instanceof Promise )
												.map( key=> 
													result[key].then( res=> (result[key] = res) )
												)
											&& result
								)
						
					}))
					.then( res=> res.length == 1 ? res[0] : res );
				
				console.groupEnd();
				return proms;
			}
			/* case Array: */else
			{
				
				result[key] = Array.isArray(json[key])
							? Promise.all( json[key].map( item=> this.extract( item, [node] )) )
							: this.extract( json[key], [node] );
			}
				
			break;
			case 'string': console.groupEnd(); return this.resolveProperty( json, nodes[0] ); break;
			case 'function': console.groupEnd(); return json( nodes[0] ); break;
			// number, boolean
			default: return json; break;
		}
	}
	extract_prom( json, nodes )
	{
		console.group( 'extract( %o, %o )', json, nodes );
		
		if( json['@selector'] )
		{
			nodes = this.selector( json['@selector'], nodes[0] );
			console.log('selected by css: ', nodes );
		}
		if( json['@xpath'] )
		{
			nodes = this.xpath( json['@xpath'], nodes[0] );
			console.log('selected by xpath: ', nodes );
		}
		
		var proms =  Promise.all(
				nodes.map( node=>
				{
					var result = {};
					
					Object.getOwnPropertyNames( json )
						.filter( key=> !/(@selector|@xpath)/.test(key) )
						// .filter( key=> key !== '@selector' && key !== '@xpath' )
						.map( key=> {
							switch( typeof json[key] )
							{
								case 'object': 
									result[key] = Array.isArray(json[key])
												? Promise.all( json[key].map( item=> this.extract( item, [node] )) )
												: this.extract( json[key], [node] );
								break;
								case 'string': result[key] = this.resolveProperty( json[key], node ); break;
								case 'function': result[key] = json[key]( node ); break;
								default: result[key] = json[key]; break;
							}
						})
					return Promise.all( Object.values(result) )
								.then( arr=> Object.getOwnPropertyNames(result)
												.filter( key=> result[key] instanceof Promise )
												.map( key=> 
													result[key].then( res=> (result[key] = res) )
												)
											&& result
								)
				})
			).then( res=> res.length == 1 ? res[0] : res );
		
		console.groupEnd();
		return proms;
	}
	async selector( sel, context )
	{
		var res = context.querySelectorAll( sel );
		var arr = Array.from( res );
		arr = arr.map( n=> n.nodeValue ? n.nodeValue : n );
		console.log('selected by querySelectorAll: ', arr );
		return arr;
	}
	async xpath( path, context )
	{
		
		var res = context.ownerDocument.evaluate( path, context, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
		var arr = Array(res.snapshotLength).fill(0)
					.map( (o,i)=> res.snapshotItem(i) );
		arr = arr.map( n=> n.nodeValue ? n.nodeValue : n );
		console.log('selected by xpath: ', arr );
		return arr;
		// return arr.length === 1
		// 		? arr[0]
		// 		: arr
	}
}
window.SchemaExtractor.schema = Symbol`schema`;


var cat = {};
Symbol.proxified = Symbol`[[proxified]]`;
Intrication = class Intrication {
	constructor()
	{
		this[Symbol.proxified] = Array.from( arguments );
		let proxy = new Proxy( this, {
			get: function( o, k )
			{
				if( Reflect.has(o, k) )
					return Reflect.get( o, k );
				debugger;
				for( var obj of o[Symbol.proxified] )
				{
					if( Reflect.has(obj, k) )
					{
						let desc = (cur => {
										var desc;
										while( cur.__proto__ != Object )
										{
											if( desc = Object.getOwnPropertyDescriptor( cur, k ) ) break;
											cur = cur.__proto__;
										}
										return desc;
									})( obj );
						return desc
								? desc.get && desc.get.bind( /native code/.test(desc.get.toString()) ? obj : proxy )()
						 	 		|| desc.value
								: typeof Reflect.get(obj, k) == 'function'
									? Reflect.get(obj, k).bind(obj)
									: Reflect.get(obj, k)
					}
				}
			}
		});
		return proxy;
	}
}
cat.Element = class Element {
	constructor( tag )
	{
		this[Symbol.proxified] = $( tag );
		let proxy = new Proxy( this, {
			get: (o,k) => Reflect.has(o[Symbol.proxified],k)
							? typeof Reflect.get(o[Symbol.proxified], k) == 'function'
								? Reflect.get(o[Symbol.proxified], k).bind(o[Symbol.proxified])
								: Reflect.get(o[Symbol.proxified], k)
							: Reflect.has( o[Symbol.proxified][0], k )
								? Reflect.get( o[Symbol.proxified][0], k )
								: Reflect.has(o,k)
									? (cur => {
											var desc;
											while( cur.__proto__ != Object )
											{
												if( desc = Object.getOwnPropertyDescriptor( cur, k ) ) break;
												cur = cur.__proto__;
											}
											if( desc )
												return desc.get && desc.get.bind( o[Symbol.proxified][0].ctrl )()
											 	 		|| desc.value;
										})(o)
									: null,
			set: (o,k,v) => Reflect.set( Reflect.has(o[Symbol.proxified],k) ? o[Symbol.proxified] : o, k, v )
		} )
		this[Symbol.proxified][0].ctrl = proxy;
		return proxy;
	}
	Element()
	{
		return this;
	}
}
cat.TabView = class TabView extends cat.Element {
	constructor( html )
	{
		debugger;
		super( html || '<tab><tabs>' );
		this.$tabs = this.find('tabs');
		this.update();
	}
	appendChild( child )
	{
		this.append( child );
		this.update();
	}
	update()
	{
		this.$tabs.empty();
		this.children().map( (i,node)=> node != this.$tabs[0]
									 && $(`<button><lang>${$(node).attr('label')||'Tab'}</lang></button>`)
									 		.on('click', e=> {
									 			this.children(':not(tabs)').hide();
									 			$(node).show();
									 			this._selectedIndex = $(node).index();
									 			this.$tabs.children().removeClass('selected');
									 			this.$tabs.children().eq(this._selectedIndex-1).addClass('selected');
								 			})
								 			.appendTo(this.$tabs)
						 );
		debugger;
		this.$tabs.children().eq(this._selectedIndex-1).addClass('selected');
	}
	get selectedIndex()	 { return this._selectedIndex }
	set selectedIndex( v )  { this.$header.find('h1').append(v) }
	get currentTab()	 	{ return this.$header.find('h1').text() }
	set currentTab( v )  	{ this.$header.find('h1').append(v) }
}
cat.Window = class Window extends cat.Element {
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
		this.$header = this.find('header');
		this.$content = this.find('.content');
		this.$footer = this.find('footer');
	}
	get icon()	 { return this.$header.find('> icon') }
	set icon( v )  { this.$header.find('h1').append(v) }
	get title()	 { return this.$header.find('h1').text() }
	set title( v )  { this.$header.find('h1').append(v) }
	get head()	  { return this.$header }
	set head( v )   { this.$header.append(v) }
	get content()   { return this.$content }
	set content( v ){ this.$content.append(v) }
	get footer()	{ return this.$footer }
	set footer( v ) { this.$footer.append(v) }
}
cat.Page = class Page extends cat.Window {
	constructor( html )
	{
		// debugger;
		super( html || '<window page>' );
		// this.$el = $('<section>');
		// this.$el[0].ctrl = this;
		// this.$el[0].innerHTML = `
		this.head = '<span>';
		// this.html(`
		//	 <header>
		//		 <h1></h1>
		//		 <span></span>
		//	 </header>
		//	 <div class="content"></div>
		//	 <footer></footer>
		// `);
		// this.$header = this.find('header');
		// this.$content = this.find('.content');
		// this.$footer = this.find('footer');
	}
	// get title()	 { return this.$header.find('h1').text() }
	// set title( v )  { this.$header.find('h1').append(v) }
	get title2()	{ return this.$header.find('span') }
	set title2( v ) { this.$header.find('span').append(v) }
	// get head()	  { return this.$header }
	// set head( v )   { this.$header.append(v) }
	// get content()   { return this.$content }
	// set content( v ){ this.$content.append(v) }
	// get footer()	{ return this.$footer }
	// set footer( v ) { this.$footer.append(v) }
}
cat.TabbedPage = class TabbedPage extends cat.Page {
	constructor( html )
	{
		// debugger;
		super( html || '<window page>' );
		this.$tabview = new cat.TabView;
		this.$tabview.appendTo( this.$content ); // appends
		this.$content = this.$tabview // replace reference
	}
}
cat.Editor = class Editor {
	constructor( before, data )
	{
		this.$el = $('<pre>');
		this.$el[0].ctrl = this;
		this.$el[0].innerHTML = `<header>${before}</header>` + this.stringify(data);
	}
	stringify( o )
	{
		return '<s>{</s>\n' +
			Object.getOwnPropertyNames(o)
				.map( n=> `<s>"</s><p contenteditable="true">${n}</p><s>"</s><k>: </k>` +
				(typeof o[n] == 'string'
				 ? JSON.stringify(o[n]).replace(/^(")(.*)(")$/, '<s>$1</s><v contenteditable="true">$2</v><s>$3</s>')
				 : `<v contenteditable="true">${JSON.stringify(o[n])}</v>`
				)).join('<s>,</s>\n')
		+ '<s>};</s>';
	}
}
cat.MultiEditor = class MultiEditor extends cat.Element {
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
		this.$root = $( this.transform(data) ).appendTo( this.rawChildren );
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
}
cat.MultiEditor.addStyle = ()=>{}
cat.MultiEditor.addPlugin = ()=>{}
cat.Navigation = class Navigation extends cat.Element {
	constructor()
	{
		super(`<nav>
				<img class="logo" src="https://devingfx.github.io/Miaow/logo.svg"/>
				<button onclick="store.showAddPage()">
					${LANG('Current page')}
				</button>
				<hr/>
				<!--span>Collections</span-->
				<ul id="collections"></ul>
				<hr/>
				<button id="schemasBtn" onclick="store.showSchemasWindow()">
					${LANG('Schemas')}
				</button>
				<button id="settingsBtn" onclick="store.showSettings()">
					${LANG('Settings')}
				</button>
			</nav>`);
		this.$collections = this.find('#collections');
		debugger;
		this.on('click', 'button', e=> {
			this.find('.selected').removeClass('selected');
			e.target.classList.add('selected'); 
		})
	}
	get buttons()	 { return this;}//.find('button') }
	set buttons( v )  { this.append(v) }
	
	updateCollections()
	{
		this.$collections.empty();
		Object.getOwnPropertyNames(this.data)
			.map( n=> 
				this.$collections.append(
					`<li><button onclick="store.showInTable(store['${n}'])">${n}</button></li>`
				)
			)
	}
}

window.ON = function(ss,...args)
{
	args = args.map( o=> typeof o == 'function' ? (ON[ON.id]=o,`ON[${ON.id++}](event)`) : o );
	return ss.map((s,i)=>s+`${args[i]||''}`).join('')
};
ON.id = 0;

// class azea {
// 	meth(){
// 		node.innerHTML = ON`<div id="coucou" onclick="${e=> this.callback()}">Coucou</div>`;
// 	}
// 	callback(){}
// }


cat.Store = class Store {
	static get deps()
	{
		return {
			css: [
				`https://cdn.datatables.net/1.10.12/css/jquery.dataTables.css`,
				`https://devingfx.github.io/Miaow/layout.css?${Math.random()}`
			],
			js: [
				"https://jspm.io/system@0.19.js",
				// `https://cdn.jsdelivr.net/lodash/4.15.0/lodash.min.js`,
				// `https://unpkg.com/lodash@4/lodash.min.js`,
				// `//devingfx.github.io/Miaow/lowdb.minou.js`,
				// `https://unpkg.com/lowdb/dist/lowdb.min.js`,
				
				`https://devingfx.github.io/Miaow/db.minou.js`,
				`https://devingfx.github.io/Miaow/db-indexed-adapter.minou.js`,
				
				`https://devingfx.github.io/Miaow/lang.js?${Math.random()}" editor="true`,
				"https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.0/jquery.min.js",
				"https://cdn.datatables.net/1.10.12/js/jquery.dataTables.js"
			]
		}
	}
	constructor()
	{
		var n;
		Store.deps.css.map( url => 
			document.head.appendChild((
				n = document.createElement('link'), 
				n.rel = "stylesheet",
				n.type = "text/css",
				n.href = url,
				n ))
		)
		Store.deps.js.map( url => 
			document.head.appendChild((
				n = document.createElement('script'), 
				n.type = "text/javascript",
				n.src = url,
				n.onload = this.start.bind( this ),
				n ))
		)
		document.documentElement.innerHTML += 
		`<head>
			<title>Miaow online - ${parentWindow.document.location.host}</title>
		</head>
		<body>
			<nav>
				<img class="logo" src="https://devingfx.github.io/Miaow/logo.svg"/>
				<button onclick="$('nav .selected').removeClass('selected');this.classList.add('selected');store.showAddPage()"
						langfr="Cette page">Current page</button>
				<hr/>
				<!--span>Collections</span-->
				<ul id="collections"></ul>
				<hr/>
				<button id="schemasBtn" onclick="$('nav .selected').removeClass('selected');this.classList.add('selected');store.showSchemasWindow()">
					<lang en>Schemas</lang>
					<lang fr>Schémas</lang>
				</button>
				<button id="settingsBtn" onclick="$('nav .selected').removeClass('selected');this.classList.add('selected');store.showSettings()">
					<lang en>Settings</lang>
					<lang fr>Préférences</lang>
				</button>
			</nav>
		</body>
		`;
		var themeColor = parentWindow.document.querySelector('meta[name="theme-color"]');
		themeColor = themeColor ? themeColor.content : "#888";
		document.body.style.color = themeColor;
		
		
		
		// console.log(Store.deps, document);
		// document.head.innerHTML += `<title>Miaow online - ${parentWindow.document.location.host}</title>`;
		// document.documentElement.appendChild(document.createElement('body'))
		// var themeColor = parentWindow.document.querySelector('meta[name="theme-color"]');
		// themeColor = themeColor ? themeColor.content : "#888";
		// document.body.style.color = themeColor;
		// document.body.innerHTML = `
		// 	<nav>
		// 		<img class="logo" src="https://devingfx.github.io/Miaow/logo.svg"/>
		// 		<button onclick="$('nav .selected').removeClass('selected');this.classList.add('selected');store.showAddPage()"
		// 				langfr="Cette page">Current page</button>
		// 		<hr/>
		// 		<!--span>Collections</span-->
		// 		<ul id="collections"></ul>
		// 		<hr/>
		// 		<button id="schemasBtn" onclick="$('nav .selected').removeClass('selected');this.classList.add('selected');store.showSchemasWindow()">
		// 			<lang en>Schemas</lang>
		// 			<lang fr>Schémas</lang>
		// 		</button>
		// 		<button id="settingsBtn" onclick="$('nav .selected').removeClass('selected');this.classList.add('selected');store.showSettings()">
		// 			<lang en>Settings</lang>
		// 			<lang fr>Préférences</lang>
		// 		</button>
		// 	</nav>
		// `
		
		// Object.getOwnPropertyNames(this.data)
		//	 .map( n=> Object.defineProperty(this, n, {get: ()=> this.data[n]}) )
		
		parentWindow.addEventListener("beforeunload", this.onPageChange.bind(this) );
	}
	start()
	{
		if( typeof $ == 'undefined'
		 || typeof loki == 'undefined'
		 || this.db ) return;
		
  //	  this.data = low('store_data');
  //	  this.data._.mixin({
		// 	type: function( collection, Type )
		// 	{
		// 		return this.filter(collection,{'@type': Type})
		// 	},
		// 	x_add: function( collection, item )
		// 	{
		// 		if( this.isString(collection) )
		// 			collection = this.get(collection);
		// 		if( !this.isArray(collection)) return object;
		// 		return this.push( collection, item )
		// 	}
		// });
		var idbAdapter = new LokiIndexedAdapter('Miaow');
		this.db = new loki( parentWindow.document.location.host, {
				autoload: true,
				autoloadCallback : this.prepareEmptyDB.bind(this),
				autosave: true, 
				autosaveInterval: 10000,
				adapter: idbAdapter
			});
		
		
		// this.schemas = SchemaList.from( JSON.parse(localStorage['store_schemas']||'{}') );
		
		this.$nav = $('nav').eq(0);
		this.$collections = $('#collections');
		// this.$main = $('#main');
		// this.updateCollections();
		// this.updateLanguage( navigator.language );
		this.onPageChange();
	}
	prepareEmptyDB()
	{
		var db = this.db, coll;
		// if database did not exist it will be empty so I will intitialize here
		this.schemas = db.getCollection('schemas') || 
						db.addCollection('schemas', {
							unique: ['@id'],
							indices: ['@id']
						});
		this.objects = db.getCollection('objects') || 
						db.addCollection('objects', {
							unique: ['@id'],
							indices: ['@id']
						});
		this.settings = db.getCollection('settings') || 
						db.addCollection('settings', {
							unique: ['@id'],
							indices: ['@id']
						});
		this.onDBReady();
	}
	onDBReady()
	{
		this.updateCollections();
	}
	onPageChange()
	{
		// parentWindow.location.pathname
	}
	// addItem()
	// {
	//	 var doc = parentWindow.document,
	//		 uri = doc.location.pathname,
	//		 pageid = uri.match(/\/(.*?)\/(.*?)\.(html|htm)/),
	//		 cat = pageid[1], id = pageid[2];
	//	 // console.log(cat,id);
	//	 if( cat && id )
	//	 {
	//		 this.data[cat] = this.data[cat] || {};
	//		 this.data[cat][id] = this.data[cat][id] || { url: uri };
	//		 this.data[cat][id].title = doc.title;
			
	//		 Array.from( doc.querySelectorAll('#adview [itemprop]') )
	//			 .map( n => {
	//				 console.log(n);
	//				 var a = n.attributes;
	//				 this.data[cat][id][a.itemprop.value] = (a.content ? a.content.value : n.textContent).trim();
					
	//			 });
	//		 Array.from( doc.querySelectorAll('#adview .line .property, #adview .line .value:not(.large-hidden)') )
	//			 .map( (n,i,a)=> {
	//				 console.log(n);
	//				 if( i%2 === 0 )
	//					 this.data[cat][id][n.innerText] = a[i+1].innerHTML.replace(/<br\s*\/*>/g,'\n');
	//			 })
			
	//		 this.panel.document.write('<pre style="width:100%;overflow:auto">'+JSON.stringify(this.data[cat][id],null,'\t')+'</pre>');
			
	//		 this.save();
	//	 }
	// }
	extract()
	{
		var doc = parentWindow.document,
			uri = doc.location.pathname,
			// pageid = uri.match(/\/(.*?)\/(.*?)\.(html|htm)/),
			// collection = pageid[1], 
			// id = pageid[2],
			extractors = this.extractors = this.extractors || JSON.parse(localStorage.store_extractors || {}),
			data;
		
		
		for( var n in extractors )
		{
			console.groupCollapsed('Extractor : %s', n);
			if( eval(n).test(uri) )
			{
				console.info('%s match %o', uri, eval(n) );
				for( var nn in extractors[n].selectors )
				{
					console.log(nn);
					console.log(extractors[n].selectors[nn]);
					Array.from( doc.querySelectorAll(nn) )
						.map( eval(extractors[n].selectors[nn]) )
				}
			}
			else
				console.info('%c%s did\'t match %o', 'color:red', uri, eval(n) );
			console.groupEnd();
		}
		
		if( collection && id )
		{}
	}
	extract2()
	{
		var doc = parentWindow.document,
			url = doc.location+'',
			// pageid = uri.match(/\/(.*?)\/(.*?)\.(html|htm)/),
			// collection = pageid[1], 
			// id = pageid[2],
			data;
		
		var results = store.schemas.find()
						.filter( schema=> new RegExp(schema.url).test(url) )
						.map( schema=> new SchemaExtractor( schema.item )
												.from( doc )
				   // 	store.objects.insert(
										// )
						)
		return results;
	}
	showObjectPage( object )
	{
		var page = new cat.Page;
		page.title = object.name || object['@type'];
		page.title2 = object.url || object['@type'];
		object.url
			&& page.title2.dblclick(e=>( parentWindow.document.location = object.url) );
		
		page.content = (
				page.editor = new cat.MultiEditor( object )
				)[Symbol.proxified];
		page.editor.save = ()=> {
			let json = JSON.parse(page.editor.toComputedString('json'));
			'$loki' in json
				? this.objects.update( json )
				: this.objects.insert( json )
		}
		page.editor.remove = ()=> {
			let json = JSON.parse(page.editor.toComputedString('json'));
			'$loki' in json
				&& this.objects.remove( json )
		}
		page.footer = ON`
			<button onclick="${e=> page.editor.save()||page.remove()}" class="important">${LANG('Save')}</button>
			<button onclick="${e=> page.remove()}">${LANG('Cancel')}</button>
			<button style="color:red" onclick="${e=> page.editor.remove()||page.remove()}">${LANG('Delete')}</button>`;
		this.showPage( page );
		return page;
	}
	showAddPage()
	{
		var page = this.showObjectPage( this.extract2()[0] );
		page.editor.save = ()=> this.objects.insert( JSON.parse(page.editor.toComputedString('json')) )
		
		return page;
	}
	addPage()
	{
		var doc = parentWindow.document,
			uri = doc.location.pathname,
			pageid = uri.match(/\/(.*?)\/(.*?)\.(html|htm)/),
			collection = pageid[1], id = pageid[2];
		// console.log(collection,id);
		if( collection && id )
		{
			var data = {}, collection,
				extractors = JSON.parse(localStorage.store_extractors || {});
			
			for( var n in extractors )
			{
				console.log(n);
				if( eval(n).test(uri) )
				{
					console.log('pass test');
					for( var nn in extractors[n].selectors )
					{
						console.log(nn);
						console.log(extractors[n].selectors[nn]);
						Array.from( doc.querySelectorAll(nn) )
							.map( eval(extractors[n].selectors[nn]) )
					}
				}
			}
			// console.log(collection, id, data);
			
			var page = new cat.Page, editor;
			page.title = doc.title;
			page.title2 = uri;
			page.content = (
					editor = new cat.Editor(`
						store.data.get("${collection}").push()
						store.data["${collection}"] = store.data["${collection}"] || {};
						store.data["${collection}"][${id}] = `,
						data)
					).$el;
			// `
			// <pre>store.data["${collection}"][${id}] = <span contenteditable="true">${JSON.stringify(data,null,'\t').replace(/([{}"':,])/g,"<s>$1</s>")}</span></pre>`;
			page.footer = `
			<button onclick="this.parentNode.parentNode.saveData()" class="important">Enregistrer</button>
			<button onclick="">Supprimer</button>`;
			this.showPage( page );
			page[Symbol.proxified][0].saveData = ()=> {
				var data = JSON.parse( editor.$el.text() );
				!this.data.has(collection) && this.data.set(collection) && this.updateCollections();
				this.data.get(collection).set( data['@id'], data );
				// store.save();
				store.updateCollections();
			}
			// var $section = $('<section>');
			// $section[0].innerHTML = `
			// <header>
			// <h1>${doc.title}</h1>
			// <span>${uri}</span><br/>
			// Collection: <input type="text" value="${cat}"/><br/>
			// Search: <input type="text" value="#adview [itemprop]"/><button>GO</button><br/>
			// Search: <input type="text" value="#adview .line .property, #adview .line .value:not(.large-hidden)"/><button>GO</button><br/>
			// </header>
			// <div class="content"><pre contenteditable="true">store.data["${cat}"][${id}] = ${JSON.stringify(data,null,'\t')}</pre></div>
			// <footer>
			// <button onclick="eval(this.previousElementSibling.innerText) && store.save()">Enregistrer</button>
			// </footer>`;
			
			// this.showSection( $section );
		}
	}
	showPage( section )
	{
		$('section').remove();
		section.appendTo('body');
		// this.updateLanguage();
	}
	showInTable( what )// $($0).parents('ObjectProperty').get().map( n=> n.getAttribute('key') ).reverse().join('.')
	{
		var colNum = 10;
		// this.$main.empty();
		// var $table = $('<table class="display compact" cellspacing="0" width="100%"><tfoot><tr></tr></tfoot></table>');
		var page = new cat.Page;
		page.title = 'collection';
		page.content = `
		<table class="display" cellspacing="0" width="100%">
			<tfoot>
				<tr>
				 ${'<td>'.repeat(colNum)}
				</tr>
			</tfoot>
		</table>`;
		page.content.css({ padding: 0 });
		this.showPage( page );
		// $table = $page.content.find('table')
		var table = page.table = page.content.find('table').DataTable({
		// var table = this._table = $table.DataTable({
			scrollY: '100%',
			scrollX: true,
			paging:   false,
			select:   true,
			// data: Object.getOwnPropertyNames( what ).map( id=> what[id] ),
			data: what,
			dom: 'iftr',
			"processing": true,
			columns: [
				{ data: 'image', title: 'Photo', width: '10%', className: 'color-filter', defaultContent: '',
					render: ( data, type, full, meta ) =>
							Array.isArray(data) && type === 'display' && data.length
							? `<div class="photo" style="background-image:url(${data[0].thumbnail})"><span>${data.length}</span></div>`
							: data},
				{ data: 'brand.name', title: 'Marque', className: 'select-filter', defaultContent: '' },
				{ data: 'model.name', title: 'Modèle', className: 'select-filter', defaultContent: '' },
				{ data: 'fuelType', title: 'Carburant', className: 'select-filter', defaultContent: '' },
				{ data: 'mileageFromOdometer.value', title: 'Km', width: '10%', defaultContent: '' },
				{ data: 'vehicleModelDate', title: 'Année', defaultContent: '' },
				// { data: 'Chevaux', title: 'Chevaux', className: 'select-filter', defaultContent: '' },
				{ data: 'offers.seller.alternateName', title: 'Vendeur', width: '10%', className: 'text-filter', defaultContent: '' },
				{ data: 'offers.availableAtOrFrom.address.addressLocality', title: 'Ville', className: 'select-filter', defaultContent: '' },
				{ data: 'offers.price', title: 'Prix', render: data => data + '€', defaultContent: '' },
				{ data: 'description', title:'Description', className: 'text-filter', defaultContent: '', 
				  render: ( data, type, full, meta ) =>
						data && type === 'display' && data.length > 40
						? `<span title="${data}">${data.substr( 0, 38 )}...</span>`
						: data
				}
			],
			initComplete: function ( settings ) {
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
		});
		
		page.title2 = page.content.find('.dataTables_info')
		page.head = page.content.find('.dataTables_filter')
									.css({
										position: 'absolute',
										right: 10,
										top: 10
									})
		page.head = page.content.find('.dataTables_scrollHead')
									.css({ margin: '14px -15px' })
		page.footer = page.content.find('.dataTables_scrollFoot')
		page.footer.css({ padding: 3 });
		page.table.draw();
	}
	showSchemasWindow()
	{
		var page = new cat.TabbedPage, editor;
		
		page.title = `<lang en>Schemas</lang><lang fr>Schémas</lang>`;
		this.schemas.find()
			.map( item=> {
				editor = new cat.MultiEditor( item.item );
				editor.attr('label', item.name );
				page.content = editor[Symbol.proxified];
			})
		editor = new cat.MultiEditor( {"@context":"http://schema.org/","@type":""} );
		editor.attr('label', "+" );
		page.content = editor[Symbol.proxified];
		page.$content.update();
		page.footer = ON`
		<button onclick="${e=> page.editor.save()}" class="important">${LANG('Save')}</button>
		<button onclick="${e=> page.editor.remove()}">${LANG('Delete')}</button>`;
		
		this.showPage( page );
	}
	showSettings()
	{
		var page = new cat.Page, editor;
		
		page.title = `<lang en>Settings</lang><lang fr>Préférences</lang>`;
		page.title2 = `<lang en>Language</lang><lang fr>Langue</lang>: ${$('html').attr('lang')}`;
		
		page.content = `<pre contenteditable="true">${JSON.stringify(JSON.parse(localStorage.store_extractors),null,'\t')}</pre>`
		
		page.footer = `
		<button onclick="this.parentNode.parentNode.saveData()" class="important"><lang en>Save</lang><lang fr>Enregistrer</lang></button>
		<button onclick="this.parentNode.parentNode.remove()"><lang en>Cancel</lang><lang fr>Annuler</lang></button>`;
		
		this.showPage( page );
		
		page[Symbol.proxified][0].saveData = ()=> {
			var settings;
			try {
				settings= JSON.parse( page.content.text() );
			}catch(e){alert(e.message)}
			
			if( settings )
				localStorage.store_extractors = JSON.stringify(settings);
			// store.save();
			// store.updateCollections();
		}
	}
	
	backup( filename )
	{
		filename = filename || 'store_data.bak.json';
		saveAs(new Blob([JSON.stringify(this.data,null,'\t')],{type: "text/plain;charset=utf-8"}), filename);
	}
  //  activeOverlay( sel=> {
  //  	var getSelector = n=>`${ n.className || n.id
		// 					? '' 
		// 					: n.localName 
		// 				}${ n.id
		// 					? '#' + n.id
		// 					: ''
		// 				}${ !n.id && n.className
		// 					? '.' + n.className
		// 								.split(' ')
		// 								.join('.')
	 //   					: ''
		// 				}`
  //  	  , loopSelectors=n=> {
	 //   		var sels=[getSelector(n)];
		// 		while(n!=n.ownerDocument.body&&!n.id)
		// 		{
		// 			n=n.parentNode;
		// 			sels.push(getSelector(n))
					
		// 		}
		// 		return sels.reverse().join(' > ')
	 //   	}
		
		// var selector = loopSelectors( sel );
		
		
  //  })
	activeOverlay(cb)
	{
		var overlay = this._overlay = parentWindow.document.createElement('overlay');
		overlay.innerHTML = `<style>
		overlay {
			position:fixed;
			z-index:999999999;
			border: 10000px solid rgba(0,0,0,0.3);
			margin: -10000px;
			pointer-events: none;
			box-sizing: content-box;
			transition:all 0.2s ease
		}</style>`;
		parentWindow.document.body.appendChild( overlay );
		
		var onClick = e=> {
				parentWindow.removeEventListener('mousemove', onMove);
				parentWindow.removeEventListener('click', onClick);
				overlay.remove();
				// delete overlay;
				cb( e.target );
			}
		  , onMove = e=> {
				var rect = e.target.getBoundingClientRect();
				overlay.style.top = rect.top+'px';
				overlay.style.height = rect.height+'px';
				overlay.style.left = rect.left+'px';
				overlay.style.width = rect.width+'px';
			}
		  ;
		parentWindow.addEventListener('mousemove', onMove );
		parentWindow.addEventListener('click', onClick );
		// parentWindow.addEventListener('click', onClick, true );
	}
	
	// update()
	// {
	//	 this.data = localStorage.store_data ? JSON.parse(localStorage.store_data) : {};
	//	 // Object.getOwnPropertyNames(this.data)
	//		 // .map( n=> Object.defineProperty(this, n, {get: ()=> this.data[n]}) )
	// }
	updateCollections()
	{
		this.$collections.empty();
		this.$collections.html(
			store.objects.DynamicViews.map( view=> 
					ON`<li>
						<button onclick="$('nav .selected').removeClass('selected');this.classList.add('selected');
						${e=>this.showInTable(view.data())}"
						>${view.name}</button>
					 </li>`
			).join('')
		)
		// this.schemas.find()//.map(o=>o.name)
		// 	.map( schema=> this.$collections.append(
		// 		ON`<li>
		// 			<button onclick="$('nav .selected').removeClass('selected');this.classList.add('selected');
		// 			${e=>this.showInTable(store.objects.findObjects(schema.potentialAction.query))}"
		// 			>${schema.name}</button>
		// 		 </li>`) )
	}
	updateLanguage( lang )
	{
		// language = null;
		// lang = lang || $('html').attr('lang');
		// $('lang').hide();
		// $(`lang[${lang}]`).show();
		// $('html').attr('lang', lang );
	}
	
	save()
	{
		localStorage.store_data = JSON.stringify( this.data );
	}
}

// window.Schema = class Schema {
// 	constructor( json )
// 	{
// 		this.schema = json;
// 		this.schema.toJson = function( pretty )
// 		{
// 			return JSON.stringify( this, null, pretty ? '\t' : null )
// 		}
// 		this.schema.toLocalStorage = function( name )
// 		{
// 			return localStorage[name] = this.toJson();
// 		}
// 		this.schema.toFile = function( name, type )
// 		{
// 			// TODO :)
// 		}
// 	}
// 	from( json )
// 	{
// 		var copy = _(this.schema).cloneDeep();
// 		return Object.assign( _(this.schema).cloneDeep(), json || {} );
// 	}
// }
// const SchemaList = new SchemaExtractor({
// 	"@context": "http://schema.org/",
// 	"@type": "ItemList",
// 	"itemListElement": "=>SchemaListItem.from(item)",
// 	"itemListElement": item=>SchemaListItem.from(item)
// })
const SchemaList = new SchemaExtractor({
	"@context": "http://schema.org/",
	"@type": "ItemList",
	"itemListElement": "=>[].concat(ListItem.from(...this.itemListElement))"
	
	// "itemListElement": {
	// 	"@selector": "json: this.itemListElement",
	// 	"@type": ListItem,
	// }
	
	// "itemListElement": "json: this.itemListElement=>ListItem.from(item)"
	// "itemListElement": {"json: this.itemListElement": ListItem }
	// "itemListElement": "json:this.itemListElement=>ListItem"
})
const ListItem = new SchemaExtractor({
	"@context": "http://schema.org/",
	"@type": "ListItem",
	"item": "=>this.item",
	"name": "=>this.name",
	"url": "=>this.url"
})
const CollectionPage = new SchemaExtractor({
	"@context": "http://schema.org/",
	"@type": "CollectionPage",
	"name": "=>this.name",
	"speciality": "=>this.speciality"
})
CollectionPage.from({
	"name": "Voitures",
	"speciality": [{
		"@type": ["Speciality","Offer","Car"],
	}]
})
// SchemaListItem.from( {item:item} )

var store = new cat.Store;




cat.MultiEditor.addStyle('SchemaExtractor', `
key[name^="@sel"] {
	color: #FFEB3B;
	text-shadow: 0 0 1px rgba(0,0,0,0.5),0 0 1px rgba(0,0,0,0.5),0 0 1px rgba(0,0,0,0.5),0 0 1px rgba(0,0,0,0.5),0 0 1px rgba(0,0,0,0.5);
}
[value^="@json:"]:after,
[value^="@selector:"]:after,
[value^="@xpath:"]:after {
	content: " ";
}
[value^="@json:"]:before,
[value^="@selector:"]:before,
[value^="@xpath:"]:before {
	content: " ";
}
key[name^="@selector"] + [value],
[value^="@json:"],
[value^="@selector:"],
[value^="@xpath:"] {
	background: #FFEB3B;
}`);
cat.MultiEditor.addStyle('jsonld', `
key[name^="@"] {
	color: #9C27B0;
	text-shadow: none;
}
key[name^="@"] + [value] {
	color: darkorchid;
}`);
cat.MultiEditor.addStyle('Editor', `
*:focus {
	box-shadow: 0 3px 10px rgba(0, 0, 0, .7);
	background: white;
}
`);
cat.MultiEditor.addStyle('Fancy', `
				String, Boolean, Number, Array, key { transition: all .3s ease; }
				String { color: green; }
				Boolean { color: lightseagreen; }
					Boolean[value=false] { color: orangered; }
				
				Number { color: blue; }
				Array { color: red; }
				/*Object { color: blueviolet; }*/
				Object > children, Array > children {
					border-left: 1px dashed;
				}
				children {
					margin-left: 4em;
					display: block;
					margin-left: 0.3em !important;
					padding-left: 4em;
				}
				Object:hover > children, Array:hover > children {
					background: rgba(0, 0, 0, 0.02);
				}
				key {
					text-shadow: 0 1px 0 rgba(0, 0, 0, 0.62);
					font-weight: bolder;
					line-height: 25px;
					padding: 4px;
					border: none;
				}
					key:before { content: ''; }
					key::after { content: ' :'; }
				`)
/*




*/