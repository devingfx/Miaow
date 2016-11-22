
window.SchemaExtractor = class SchemaExtractor {
	constructor( json, doc )
	{
		this[SchemaExtractor.schema] = json;
		// this[SchemaExtractor.schema].toJsonString = function( pretty )
		// {
		// 	return JSON.stringify( this, null, pretty ? '\t' : null )
		// }
		// this[SchemaExtractor.schema].toLocalStorage = function( name )
		// {
		// 	return localStorage[name] = this.toJsonString();
		// }
		// this[SchemaExtractor.schema].toFile = function( name, type )
		// {
		// 	// TODO :)
		// }
		if( doc )
			return this.from( doc );
	}
	from()
	{
		var things = Array.from( arguments );
		things[0] = things[0] || document;
		return this.extract( this[SchemaExtractor.schema], things )
	}
	resolveProperty( val, node )
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
		handlers.length &&
			handlers.map(f=>(val = (Array.isArray(val)?val:[val]).map(f)));
		
		return Array.isArray(val) && val.length == 1
				? val[0]
				: val;
	}
	extract( json, nodes )
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
				.map( key=> {
					if( key !== '@selector' && key !== '@xpath' )
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
	selector( sel, context )
	{
		var res = context.querySelectorAll( sel );
		var arr = Array.from( res );
		arr = arr.map( n=> n.nodeValue ? n.nodeValue : n );
		return arr;
	}
	xpath( path, context )
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
}
window.SchemaExtractor.schema = Symbol`schema`;

var cat = {};
cat.Element = class Element {
    constructor( tag )
    {
        this._target = $( tag );
        let proxy = new Proxy( this, {
            get: (o,k) => Reflect.has(this._target,k)
            				? typeof Reflect.get(this._target, k) == 'function'
            					? Reflect.get(this._target, k).bind(this._target)
            					: Reflect.get(this._target, k)
            				: Reflect.has( o._target[0], k )
            					? Reflect.get( o._target[0], k )
            					: Reflect.get( o,k ),
            set: (o,k,v) => Reflect.set( Reflect.has(this._target,k) ? this._target : o, k, v )
        } )
        this._target[0].ctrl = proxy;
        return proxy;
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
    get selectedIndex()     { return this._selectedIndex }
    set selectedIndex( v )  { this.$header.find('h1').append(v) }
    get currentTab()     	{ return this.$header.find('h1').text() }
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
    get icon()     { return this.$header.find('> icon') }
    set icon( v )  { this.$header.find('h1').append(v) }
    get title()     { return this.$header.find('h1').text() }
    set title( v )  { this.$header.find('h1').append(v) }
    get head()      { return this.$header }
    set head( v )   { this.$header.append(v) }
    get content()   { return this.$content }
    set content( v ){ this.$content.append(v) }
    get footer()    { return this.$footer }
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
        //     <header>
        //         <h1></h1>
        //         <span></span>
        //     </header>
        //     <div class="content"></div>
        //     <footer></footer>
        // `);
        // this.$header = this.find('header');
        // this.$content = this.find('.content');
        // this.$footer = this.find('footer');
    }
    // get title()     { return this.$header.find('h1').text() }
    // set title( v )  { this.$header.find('h1').append(v) }
    get title2()    { return this.$header.find('span').text() }
    set title2( v ) { this.$header.find('span').append(v) }
    // get head()      { return this.$header }
    // set head( v )   { this.$header.append(v) }
    // get content()   { return this.$content }
    // set content( v ){ this.$content.append(v) }
    // get footer()    { return this.$footer }
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
        super( `<pre style="margin:0">
        	<style>
			    *:focus {
			        outline: none;
			    }
			    String, Boolean, Number, Array, key { display: inline; }
			    String {  }
				    String:before { content: '"'; }
				    String:after { content: '"'; }
			    Boolean {  }
			    Number {  }
			    Array {  }
				    Array:before { content: "["; }
				    Array:after { content: "]"; }
			    Object {  }
				    Object:before { content: "{"; }
				    Object:after { content: "}"; }
				children {
				    margin-left: 4em;
				    display: block;
				}
				key {
				    border-bottom: 1px dashed;
				}
					key:before { content: '"'; }
					key::after { content: '":'; }
        	</style>
    	</pre>` );
    	this.append( this.transform(data) );
    	this.customStyles = {}
        // this.$el[0].innerHTML = `<header>${before}</header>` + this.stringify(data);
	    document.body.setAttribute('spellcheck',"false");
	    Array.from( this.find('[contenteditable]').get() )
	        .map( node=> 
	        	node.addEventListener('keydown', e=> {
	        		debugger;
	        		e.key == 'Enter' && (e.preventDefault(),e.target.blur());
	        	}) 
	        )
        
    }
    transform( json )
    {
        switch( typeof json )
        {
            case 'string': return JSON.stringify( json ).replace(/^(")(.*)(")$/, 
                                '<String contenteditable="true" value="$2">$2</String>');
            case 'boolean': return `<Boolean value="${json}" contenteditable="true">${json}</Boolean>`;
            case 'number': return `<Number value="${json}" contenteditable="true">${json}</Number>`;
            case 'object': if( Array.isArray(json) )
                                return `<Array><children>${json.map( item=> this.transform(item) ).join(',\n')}</children></Array>`;
                            else
                                return `<Object type="${json['@type']||json.constructor.name}"><children>${Object.getOwnPropertyNames(json)
        .map( n=> `<key contenteditable="true" name="${n}">${n}</key>${this.transform(json[n])}` )
        .join(',\n')
    }</children></Object>`;
        }
    }
    toComputedString()
    {
    	let copy = this.clone();
    	copy.find('style').remove();
    	this.append( copy );
    	copy.find('*:not(style)')
    		.map( (i,n)=> {
			    $(n).prepend( eval(getComputedStyle(n,':before').content) )
			    	.append( eval(getComputedStyle(n,':after').content) )
			})
		let str = copy.text();
		copy.remove();
		return str;
    }
    addStyle( name, css )
    {
    	var s = document.createElement('style');
		s.id = name;
		s.innerText = css;
		this.append(s);
		s.disabled = true;
    	this.customStyles[name] = s;
    }
    toggleStyle( name, force )
    {
    	this.customStyles[name].disabled = typeof force != 'undefined' ? !!force : !this.customStyles[name].disabled;
    }
}
cat.MultiEditor.addStyle = ()=>{}
cat.MultiEditor.addPlugin = ()=>{}
cat.Navigation = class Navigation extends cat.Element {
    constructor()
    {
        super('<nav>');
    }
    updateCollections()
    {
        this.$collections.empty();
        Object.getOwnPropertyNames(this.data)
            .map( n=> this.$collections.append(`<li><button onclick="$('nav .selected').removeClass('selected');this.classList.add('selected');store.showInTable(store['${n}'])">${n}</button></li>`) )
    }
}

window.ON = function(ss,...args)
{
	args = args.map( o=> typeof o == 'function' ? (ON[ON.id]=o,`ON[${ON.id++}](event)`) : o );
	return ss.map((s,i)=>s+`${args[i]||''}`).join('')
};
ON.id = 0;


cat.Store = class Store {
    static get deps()
    {
        return {
            css: [
                `https://devingfx.github.io/Miaow/layout.css?${Math.random()}`,
                `https://cdn.datatables.net/1.10.12/css/jquery.dataTables.css`
            ],
            js: [
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
        Store.deps.css.map( url => document.write(`<link rel="stylesheet" type="text/css" href="${url}">`) )
        Store.deps.js.map( url => document.write(`<script type="text/javascript" src="${url}" onload="store.start()"></script>`) )
        console.log(Store.deps, document);
        document.write(`<title>Miaow online - ${parentWindow.document.location.host}</title>`);
        document.documentElement.appendChild(document.createElement('body'))
        var themeColor = parentWindow.document.querySelector('meta[name="theme-color"]');
        themeColor = themeColor ? themeColor.content : "#888";
        document.body.style.color = themeColor;
        document.body.innerHTML = `
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
        `
        
        // Object.getOwnPropertyNames(this.data)
        //     .map( n=> Object.defineProperty(this, n, {get: ()=> this.data[n]}) )
        
        parentWindow.addEventListener("beforeunload", this.onPageChange.bind(this) );
    }
    start()
    {
        if( typeof $ == 'undefined'
         || typeof loki == 'undefined'
         || this.db ) return;
        
  //      this.data = low('store_data');
  //      this.data._.mixin({
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
        this.updateLanguage( navigator.language );
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
    //     var doc = parentWindow.document,
    //         uri = doc.location.pathname,
    //         pageid = uri.match(/\/(.*?)\/(.*?)\.(html|htm)/),
    //         cat = pageid[1], id = pageid[2];
    //     // console.log(cat,id);
    //     if( cat && id )
    //     {
    //         this.data[cat] = this.data[cat] || {};
    //         this.data[cat][id] = this.data[cat][id] || { url: uri };
    //         this.data[cat][id].title = doc.title;
            
    //         Array.from( doc.querySelectorAll('#adview [itemprop]') )
    //             .map( n => {
    //                 console.log(n);
    //                 var a = n.attributes;
    //                 this.data[cat][id][a.itemprop.value] = (a.content ? a.content.value : n.textContent).trim();
                    
    //             });
    //         Array.from( doc.querySelectorAll('#adview .line .property, #adview .line .value:not(.large-hidden)') )
    //             .map( (n,i,a)=> {
    //                 console.log(n);
    //                 if( i%2 === 0 )
    //                     this.data[cat][id][n.innerText] = a[i+1].innerHTML.replace(/<br\s*\/*>/g,'\n');
    //             })
            
    //         this.panel.document.write('<pre style="width:100%;overflow:auto">'+JSON.stringify(this.data[cat][id],null,'\t')+'</pre>');
            
    //         this.save();
    //     }
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
        page.title = object.name;
        page.title2 = object.url || object['@type'];
        page.content = (
                page.editor = new cat.MultiEditor( object )
                )._target;
        page.footer = ON`
        <button onclick="${e=> page.editor.save()}" class="important">${LANG('Save')}</button>
        <button onclick="${e=> page.editor.remove()}">${LANG('Delete')}</button>`;
        this.showPage( page );
        return page;
    }
    showAddPage()
    {
		var page = this.showObjectPage( this.extract2()[0] );
		page.editor.save = ()=> this.objects.insert( JSON.parse(page.editor.toComputedString()) )
		
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
            page._target[0].saveData = ()=> {
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
        this.updateLanguage();
    }
    showInTable( what )
    {
        var colNum = 8;
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
            data: Object.getOwnPropertyNames( what ).map( id=> what[id] ),
            dom: 'iftr',
            "processing": true,
            columns: [
                { data: 'Marque', title: 'Marque', className: 'select-filter', defaultContent: '' },
                { data: 'Modèle', title: 'Modèle', className: 'select-filter', defaultContent: '' },
                { data: 'Carburant', title: 'Carburant', className: 'select-filter', defaultContent: '' },
                { data: 'Kilométrage', title: 'Kilométrage', defaultContent: '' },
                { data: 'releaseDate', title: 'Année', defaultContent: '' },
                { data: 'Chevaux', title: 'Chevaux', className: 'select-filter', defaultContent: '' },
                { data: 'price', title: 'Prix', render: data => data + '€', defaultContent: '' },
                { data: 'description', title:'Description', className: 'text-filter', defaultContent: '', render: function ( data, type, full, meta ) {
                    return data && type === 'display' && data.length > 40 ?
                        '<span title="'+data+'">'+data.substr( 0, 38 )+'...</span>' :
                        data;
                    } }
            ],
            initComplete: function () {
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
                            //     $(this).val()
                            // );
                            if ( column.search() !== this.value ) {
                                column
                                    .search( this.value )
                                    .draw();
                                // column
                                //     .search( val ? '^'+val+'$' : '', true, false )
                                //     .draw();
                            }
                        } );
                } );
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
                                    .css({ margin: '8px -15px' })
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
	    		page.content = editor._target;
	    	})
	    editor = new cat.MultiEditor( {"@context":"http://schema.org/","@type":""} );
		editor.attr('label', "+" );
		page.content = editor._target;
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
	    
	    page._target[0].saveData = ()=> {
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
		// 		    	}${ n.id
		// 		    		? '#' + n.id
		// 		    		: ''
		// 		    	}${ !n.id && n.className
		// 		    		? '.' + n.className
		// 		    					.split(' ')
		// 		    					.join('.')
	 //   					: ''
		// 		    	}`
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
    //     this.data = localStorage.store_data ? JSON.parse(localStorage.store_data) : {};
    //     // Object.getOwnPropertyNames(this.data)
    //         // .map( n=> Object.defineProperty(this, n, {get: ()=> this.data[n]}) )
    // }
    updateCollections()
    {
        this.$collections.empty();
        this.schemas.find()//.map(o=>o.name)
            .map( schema=> this.$collections.append(`<li><button onclick="$('nav .selected').removeClass('selected');this.classList.add('selected');store.showInTable(store.objects.find({'@type':'${schema.item['@type']}'}))">${schema.name}</button></li>`) )
    }
    updateLanguage( lang )
    {
        language = null;
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