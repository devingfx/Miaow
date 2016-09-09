
window.Schema = class Schema {
	constructor( json, doc )
	{
		this[Schema.document] = doc || document;
		this[Schema.schema] = json;
		this.result = this.extract( json, [(doc || document).documentElement] );
	}
	resolveProperty( val, node )
	{
		var handlers = [];
		if( val.indexOf('=>') !== -1 )
		{
			var a = val.split('=>');
			val = a.shift();
			handlers = a.map( js=> new Function('item,index,list',`return `+js) );
		}
		if( val.indexOf('xpath:') === 0 )
		{
			var a = val.split(':');
			a.shift();
			val = a.join(':');
			val = this.xpath( val, node );
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
							default: result[key] = json[key]; break;
						}
				})
			return result;
		})
		return res.length == 1 ? res[0] : res;
	}
	selector( sel, context )
	{
		context = context || this[Schema.document];
		var res = context.querySelectorAll( sel );
		var arr = Array.from( res );
		arr = arr.map( n=> n.nodeValue ? n.nodeValue : n );
		return arr;
	}
	xpath( path, context )
	{
		context = context || this[Schema.document];
		var res = this[Schema.document].evaluate( path, context, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
		var arr = Array(res.snapshotLength).fill(0)
					.map( (o,i)=> res.snapshotItem(i) );
		arr = arr.map( n=> n.nodeValue ? n.nodeValue : n );
		return arr;
		// return arr.length === 1
		// 		? arr[0]
		// 		: arr
	}
}
window.Schema.document = Symbol`document`;
window.Schema.schema = Symbol`schema`;


window.Store = class Store {
    static get deps()
    {
        return {
            css: [
                "//devingfx.github.io/Miaow/layout.css",
                "//cdn.datatables.net/1.10.12/css/jquery.dataTables.css"
            ],
            js: [
                `//devingfx.github.io/Miaow/lang.js`,
                "//cdnjs.cloudflare.com/ajax/libs/jquery/3.1.0/jquery.min.js",
                "//cdn.datatables.net/1.10.12/js/jquery.dataTables.js"
            ]
        }
    }
    static get Element()
    {
        return class Element {
            constructor( tag )
            {
                this._target = $( tag );
                return new Proxy( this, {
                    get: (o,k) => Reflect.get( Reflect.has(this._target,k) ? this._target : o, k ),
                    set: (o,k,v) => Reflect.set( Reflect.has(this._target,k) ? this._target : o, k, v )
                } )
            }
        }
    }
    static get Page()
    {
        return class Page extends Store.Element {
            constructor()
            {
                // debugger;
                super('<section>');
                // this.$el = $('<section>');
                // this.$el[0].ctrl = this;
                // this.$el[0].innerHTML = `
                this.html(`
                    <header>
                        <h1></h1>
                        <span></span>
                    </header>
                    <div class="content"></div>
                    <footer></footer>
                `);
                this.$header = this.find('header');
                this.$content = this.find('.content');
                this.$footer = this.find('footer');
            }
            get title()     { return this.$header.find('h1').text() }
            set title( v )  { this.$header.find('h1').append(v) }
            get title2()    { return this.$header.find('span').text() }
            set title2( v ) { this.$header.find('span').append(v) }
            get head()      { return this.$header }
            set head( v )   { this.$header.append(v) }
            get content()   { return this.$content }
            set content( v ){ this.$content.append(v) }
            get footer()    { return this.$footer }
            set footer( v ) { this.$footer.append(v) }
        }
    }
    static get Editor()
    {
        return class Editor {
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
    }
    static get Navigation()
    {
        return class Navigation {
            constructor()
            {
                this.$el = $('<nav>');
                this.$el[0].ctrl = this;
            }
            updateCollections()
            {
                this.$collections.empty();
                Object.getOwnPropertyNames(this.data)
                    .map( n=> this.$collections.append(`<li><button onclick="$('nav .selected').removeClass('selected');this.classList.add('selected');store.showInTable(store['${n}'])">${n}</button></li>`) )
            }
        }
    }
    constructor()
    {
        Store.deps.css.map( url => document.write(`<link rel="stylesheet" type="text/css" href="${url}?${Math.random()}">`) )
        Store.deps.js.map( url => document.write(`<script type="text/javascript" src="${url}?${Math.random()}" onload="store.start()"></script>`) )
        console.log(Store.deps, document);
        document.write(`<title>Miaow online - ${parentWindow.document.location.host}</title>`);
        document.documentElement.appendChild(document.createElement('body'))
        var themeColor = parentWindow.document.querySelector('meta[name="theme-color"]');
        themeColor = themeColor ? themeColor.content : "#888";
        document.body.style.color = themeColor;
        document.body.innerHTML = `
            <nav>
                <img class="logo" src="//devingfx.github.io/Miaow/logo.svg"/>
                <button onclick="$('nav .selected').removeClass('selected');this.classList.add('selected');store.addPage()"
                		langfr="Cette page">Current page</button>
                <hr/>
                <!--span>Collections</span-->
                <ul id="collections"></ul>
                <hr/>
                <button id="settingsBtn" onclick="$('nav .selected').removeClass('selected');this.classList.add('selected');store.showSettings()">
                	<lang en>Settings</lang>
                	<lang fr>Préférences</lang>
            	</button>
            </nav>
        `
        
        this.data = localStorage.store_data ? JSON.parse(localStorage.store_data) : {};
        Object.getOwnPropertyNames(this.data)
            .map( n=> Object.defineProperty(this, n, {get: ()=> this.data[n]}) )
        
        parentWindow.addEventListener("beforeunload", this.onPageChange.bind(this) );
        this.onPageChange();
    }
    start()
    {
        if( this.$nav ) return;
        this.$nav = $('nav').eq(0);
        this.$collections = $('#collections');
        // this.$main = $('#main');
        this.updateCollections();
        this.updateLanguage( navigator.language );
    }
    onPageChange()
    {
        // parentWindow.location.pathname
    }
    addItem()
    {
        var doc = parentWindow.document,
            uri = doc.location.pathname,
            pageid = uri.match(/\/(.*?)\/(.*?)\.(html|htm)/),
            cat = pageid[1], id = pageid[2];
        // console.log(cat,id);
        if( cat && id )
        {
            this.data[cat] = this.data[cat] || {};
            this.data[cat][id] = this.data[cat][id] || { url: uri };
            this.data[cat][id].title = doc.title;
            
            Array.from( doc.querySelectorAll('#adview [itemprop]') )
                .map( n => {
                    console.log(n);
                    var a = n.attributes;
                    this.data[cat][id][a.itemprop.value] = (a.content ? a.content.value : n.textContent).trim();
                    
                });
            Array.from( doc.querySelectorAll('#adview .line .property, #adview .line .value:not(.large-hidden)') )
                .map( (n,i,a)=> {
                    console.log(n);
                    if( i%2 === 0 )
                        this.data[cat][id][n.innerText] = a[i+1].innerHTML.replace(/<br\s*\/*>/g,'\n');
                })
            
            this.panel.document.write('<pre style="width:100%;overflow:auto">'+JSON.stringify(this.data[cat][id],null,'\t')+'</pre>');
            
            this.save();
        }
    }
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
            
            var page = new Store.Page, editor;
            page.title = doc.title;
            page.title2 = uri;
            page.content = (
                    editor = new Store.Editor(`
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
                eval( editor.$el.text() );
                store.save();
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
        var page = new Store.Page;
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
                    return type === 'display' && data.length > 40 ?
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
    showSettings()
    {
		var page = new Store.Page, editor;
		
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
    
    update()
    {
        this.data = localStorage.store_data ? JSON.parse(localStorage.store_data) : {};
        // Object.getOwnPropertyNames(this.data)
            // .map( n=> Object.defineProperty(this, n, {get: ()=> this.data[n]}) )
    }
    updateCollections()
    {
        this.$collections.empty();
        Object.getOwnPropertyNames(this.data)
            .map( n=> this.$collections.append(`<li><button onclick="$('nav .selected').removeClass('selected');this.classList.add('selected');store.showInTable(store['${n.replace(/'/g,"\\'")}'])">${n}</button></li>`) )
    }
    updateLanguage( lang )
    {
        lang = lang || $('html').attr('lang');
        $('lang').hide();
        $(`lang[${lang}]`).show();
        $('html').attr('lang', lang );
    }
    
    save()
    {
        localStorage.store_data = JSON.stringify( this.data );
    }
}

var store = new Store;



function panel()
{
    var win = window.open(null,'LBCDataStore','menubar=no,location=no,resizable=yes,scrollbars=no,status=no'); 
    win.parentWindow = window;
    win.eval('window.store = new (eval(localStorage.Store));' )
    return win; 
}

