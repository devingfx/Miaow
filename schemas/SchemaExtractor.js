class SchemaExtractor {
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
				
				// console.groupEnd();
				return proms;
			}
			/* case Array: */else
			{
				
				result[key] = Array.isArray(json[key])
							? Promise.all( json[key].map( item=> this.extract( item, [node] )) )
							: this.extract( json[key], [node] );
				
				// console.groupEnd();
			}
				
			break;
			case 'string': return this.resolveProperty( json, nodes[0] ); break;
			case 'function': return json( nodes[0] ); break;
			// number, boolean
			default: return json; break;
		}
		
		console.groupEnd();
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
SchemaExtractor.schema = Symbol`schema`;
export { SchemaExtractor };