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

import 'https://cdn.datatables.net/1.10.12/css/jquery.dataTables.css';
import 'https://devingfx.github.io/Miaow/layout.css';

import loki from 'https://devingfx.github.io/Miaow/db.minou.js';
import LokiIndexedAdapter from 'https://devingfx.github.io/Miaow/db-indexed-adapter.minou.js';

import $ from 'jquery';
// import 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.0/jquery.min.js';
import 'https://cdn.datatables.net/1.10.12/js/jquery.dataTables.js';

import './lang.js';
import { SchemaExtractor } from './schemas/SchemaExtractor.js';


// var cat = {};
Symbol.proxified = Symbol`[[proxified]]`;
// Intrication = class Intrication {
// 	constructor()
// 	{
// 		this[Symbol.proxified] = Array.from( arguments );
// 		let proxy = new Proxy( this, {
// 			get: function( o, k )
// 			{
// 				if( Reflect.has(o, k) )
// 					return Reflect.get( o, k );
// 				debugger;
// 				for( var obj of o[Symbol.proxified] )
// 				{
// 					if( Reflect.has(obj, k) )
// 					{
// 						let desc = (cur => {
// 										var desc;
// 										while( cur.__proto__ != Object )
// 										{
// 											if( desc = Object.getOwnPropertyDescriptor( cur, k ) ) break;
// 											cur = cur.__proto__;
// 										}
// 										return desc;
// 									})( obj );
// 						return desc
// 								? desc.get && desc.get.bind( /native code/.test(desc.get.toString()) ? obj : proxy )()
// 						 	 		|| desc.value
// 								: typeof Reflect.get(obj, k) == 'function'
// 									? Reflect.get(obj, k).bind(obj)
// 									: Reflect.get(obj, k)
// 					}
// 				}
// 			}
// 		});
// 		return proxy;
// 	}
// }

// import { Element } from './views/Element.js';
// import { TabView } from './views/TabView.js';
import { Window } from './views/Window.js';
import { Page } from './views/Page.js';
// import { TabbedPage } from './views/TabbedPage.js';
// import { Editor } from './views/Editor.js';
// import { MultiEditor } from './views/MultiEditor.js';
import { Navigation } from './views/Navigation.js';


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


export default class Store {
	
	constructor()
	{
		document.documentElement.innerHTML += 
		`<head>
			<title>Miaow online - ${parentWindow.document.location.host}</title>
		</head>
		<body>
		</body>`;
		document.body.appendChild(
			(this.nav = new Navigation)[Symbol.proxified][0]
		)
		// <body>
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
		// </body>
		// `;
		var themeColor = parentWindow.document.querySelector('meta[name="theme-color"]');
		themeColor = themeColor ? themeColor.content : "#888";
		document.body.style.color = themeColor;
		
		// parentWindow.addEventListener("beforeunload", this.onPageChange.bind(this) );
		
		this.start();
	}
	start()
	{
		// if( typeof $ == 'undefined'
		//  || typeof loki == 'undefined'
		//  || this.db ) return;
		
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
		
		// this.$nav = $('nav').eq(0);
		// this.$collections = $('#collections');
		// this.$main = $('#main');
		// this.updateCollections();
		// this.updateLanguage( navigator.language );
		// this.onPageChange();
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
		this.nav.updateCollections();
	}
	// onPageChange()
	// {
	// 	// parentWindow.location.pathname
	// }
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
	// addPage()
	// {
	// 	var doc = parentWindow.document,
	// 		uri = doc.location.pathname,
	// 		pageid = uri.match(/\/(.*?)\/(.*?)\.(html|htm)/),
	// 		collection = pageid[1], id = pageid[2];
	// 	// console.log(collection,id);
	// 	if( collection && id )
	// 	{
	// 		var data = {}, collection,
	// 			extractors = JSON.parse(localStorage.store_extractors || {});
			
	// 		for( var n in extractors )
	// 		{
	// 			console.log(n);
	// 			if( eval(n).test(uri) )
	// 			{
	// 				console.log('pass test');
	// 				for( var nn in extractors[n].selectors )
	// 				{
	// 					console.log(nn);
	// 					console.log(extractors[n].selectors[nn]);
	// 					Array.from( doc.querySelectorAll(nn) )
	// 						.map( eval(extractors[n].selectors[nn]) )
	// 				}
	// 			}
	// 		}
	// 		// console.log(collection, id, data);
			
	// 		var page = new cat.Page, editor;
	// 		page.title = doc.title;
	// 		page.title2 = uri;
	// 		page.content = (
	// 				editor = new cat.Editor(`
	// 					store.data.get("${collection}").push()
	// 					store.data["${collection}"] = store.data["${collection}"] || {};
	// 					store.data["${collection}"][${id}] = `,
	// 					data)
	// 				).$el;
	// 		// `
	// 		// <pre>store.data["${collection}"][${id}] = <span contenteditable="true">${JSON.stringify(data,null,'\t').replace(/([{}"':,])/g,"<s>$1</s>")}</span></pre>`;
	// 		page.footer = `
	// 		<button onclick="this.parentNode.parentNode.saveData()" class="important">Enregistrer</button>
	// 		<button onclick="">Supprimer</button>`;
	// 		this.showPage( page );
	// 		page[Symbol.proxified][0].saveData = ()=> {
	// 			var data = JSON.parse( editor.$el.text() );
	// 			!this.data.has(collection) && this.data.set(collection) && this.updateCollections();
	// 			this.data.get(collection).set( data['@id'], data );
	// 			// store.save();
	// 			store.updateCollections();
	// 		}
	// 		// var $section = $('<section>');
	// 		// $section[0].innerHTML = `
	// 		// <header>
	// 		// <h1>${doc.title}</h1>
	// 		// <span>${uri}</span><br/>
	// 		// Collection: <input type="text" value="${cat}"/><br/>
	// 		// Search: <input type="text" value="#adview [itemprop]"/><button>GO</button><br/>
	// 		// Search: <input type="text" value="#adview .line .property, #adview .line .value:not(.large-hidden)"/><button>GO</button><br/>
	// 		// </header>
	// 		// <div class="content"><pre contenteditable="true">store.data["${cat}"][${id}] = ${JSON.stringify(data,null,'\t')}</pre></div>
	// 		// <footer>
	// 		// <button onclick="eval(this.previousElementSibling.innerText) && store.save()">Enregistrer</button>
	// 		// </footer>`;
			
	// 		// this.showSection( $section );
	// 	}
	// }
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
		
		page.title = LANG('Settings');
		page.title2 = `${LANG('Language')}: ${$('html').attr('lang')}`;
		
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
			// store.nav.updateCollections();
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
	// deprecated_updateCollections()
	// {
	// 	this.$collections.empty();
	// 	this.$collections.html(
	// 		store.objects.DynamicViews.map( view=> 
	// 				ON`<li>
	// 					<button onclick="$('nav .selected').removeClass('selected');this.classList.add('selected');
	// 					${e=>this.showInTable(view.data())}"
	// 					>${view.name}</button>
	// 				 </li>`
	// 		).join('')
	// 	)
	// 	// this.schemas.find()//.map(o=>o.name)
	// 	// 	.map( schema=> this.$collections.append(
	// 	// 		ON`<li>
	// 	// 			<button onclick="$('nav .selected').removeClass('selected');this.classList.add('selected');
	// 	// 			${e=>this.showInTable(store.objects.findObjects(schema.potentialAction.query))}"
	// 	// 			>${schema.name}</button>
	// 	// 		 </li>`) )
	// }
	
}