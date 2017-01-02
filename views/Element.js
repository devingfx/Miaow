export class Element {
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
	
	appendChild( child )
	{
		return super.appendChild( child[Symbol.proxified] ? child[Symbol.proxified][0] : child );
	}
}