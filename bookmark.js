javascript:
var win = window.open(null,`cat://${document.location.host}`,'menubar=no,location=no,resizable=yes,scrollbars=no,status=no'); 
win.parentWindow = window;
win.document.write('<body>');
var scr = win.document.createElement('script');
scr.src = "https://jspm.io/system.js";
scr.setAttribute('onload', `
System.config({
	baseURL: 'https://devingfx.github.io/Miaow',
	defaultJSExtensions: false,
	map: {
		jquery: "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.min.js",
		css: 'github:systemjs/plugin-css@0.1.32/css',
	},
	meta: {
		'*.css': { loader: 'css' },
		'*.js': {
		}
	},
	traceurOptions: {
		symbols: true,
		arrayComprehension: true,
		asyncFunctions: true,
		classes: 'parse'
	}
});
System.import('css');
System.import('https://devingfx.github.io/Miaow/Store.js?'+Math.random())
	.then( module=> console.log(window.Store = module.default, window.store = new Store) )
`);
win.document.head.appendChild(scr);





_____________________________________
/*win.document.write(`<script src="https://devingfx.github.io/Miaow/DataStore.js?${Math.random()}"></script>`);*/
/*win.document.write(`
<script src="https://jspm.io/system.js" onload="eval(event.target.innerHTML)">
</script>
`);*/
		'plugin-babel': 'github:systemjs/plugin-babel/plugin-babel',
    	'systemjs-babel-build': 'github:systemjs/plugin-babel/systemjs-babel-browser'
	transpiler: 'plugin-babel',
			babelOptions: {
				es2015: false
			}
traceurOptions: {
		symbols: true,
		arrayComprehension: true,
		asyncFunctions: true,
		asyncGenerators: true,
		forOn: true,
		generatorComprehension: true
	},
	babelOptions: {
		"presets": [
			["env", {
				"targets": {
					"chrome": 52
				}
			}]
		]
	},